import amqp from 'amqplib';
import type { ChannelModel, Channel, ConsumeMessage } from 'amqplib';
import { EVENT_SCHEMAS, type EventName, type EventPayload } from './events';

const EXCHANGE = 'lumiere.events';
const DEAD_LETTER_EXCHANGE = 'lumiere.events.dlx';
const DEAD_LETTER_QUEUE = 'lumiere.events.dlx.queue';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

async function getChannel(url: string): Promise<Channel> {
  if (channel) return channel;

  connection = await amqp.connect(url);
  channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  await channel.assertExchange(DEAD_LETTER_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(DEAD_LETTER_QUEUE, { durable: true });
  await channel.bindQueue(DEAD_LETTER_QUEUE, DEAD_LETTER_EXCHANGE, '#');

  return channel;
}

/** Publish a validated event onto the shared topic exchange. Routing key == event name. */
export async function publishEvent<K extends EventName>(
  url: string,
  eventName: K,
  payload: EventPayload<K>,
): Promise<void> {
  const schema = EVENT_SCHEMAS[eventName];
  const validated = schema.parse(payload);
  const ch = await getChannel(url);
  ch.publish(EXCHANGE, eventName, Buffer.from(JSON.stringify(validated)), {
    contentType: 'application/json',
    persistent: true,
  });
}

/**
 * Bind a durable queue named `${serviceName}.${eventName}` to the given routing key
 * and consume it. Handler failures nack-without-requeue so the message lands on the
 * shared dead-letter queue (inspectable via the RabbitMQ management UI) instead of
 * looping forever or being silently dropped.
 */
export async function subscribeToEvent<K extends EventName>(
  url: string,
  serviceName: string,
  eventName: K,
  handler: (payload: EventPayload<K>) => Promise<void>,
): Promise<void> {
  const schema = EVENT_SCHEMAS[eventName];
  const ch = await getChannel(url);
  const queueName = `${serviceName}.${eventName}`;

  await ch.assertQueue(queueName, {
    durable: true,
    deadLetterExchange: DEAD_LETTER_EXCHANGE,
  });
  await ch.bindQueue(queueName, EXCHANGE, eventName);
  await ch.prefetch(5);

  ch.consume(queueName, (msg: ConsumeMessage | null) => {
    if (!msg) return;
    void (async () => {
      try {
        const parsed = JSON.parse(msg.content.toString());
        // schema was looked up via the same `eventName`/K as `handler` expects, so this
        // is sound — TS just can't correlate a generic key lookup with a generic param.
        const validated = schema.parse(parsed) as EventPayload<K>;
        await handler(validated);
        ch.ack(msg);
      } catch (err) {
        console.error(`[bus] ${serviceName}: handler failed for ${eventName}:`, err);
        ch.nack(msg, false, false);
      }
    })();
  });
}

export async function closeBus(): Promise<void> {
  await channel?.close();
  await connection?.close();
  channel = null;
  connection = null;
}
