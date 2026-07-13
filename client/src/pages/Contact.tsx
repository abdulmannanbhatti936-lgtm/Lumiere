import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearch } from 'wouter';
import { CheckCircle, Mail, Phone, MapPin } from 'lucide-react';
import { TRPCClientError } from '@trpc/client';
import { contactMessageSchema, type ContactMessageInput } from '@shared/validation';
import { trpc } from '@/lib/trpc';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const SUBJECTS = ['General enquiry', 'Booking support', 'Partnerships', 'Press', 'Other'] as const;

function isValidSubject(value: string | null): value is (typeof SUBJECTS)[number] {
  return !!value && (SUBJECTS as readonly string[]).includes(value);
}

export default function Contact() {
  const searchParams = new URLSearchParams(useSearch());
  const tourName = searchParams.get('tour');
  const subjectParam = searchParams.get('subject');

  const submitMessage = trpc.contact.submit.useMutation();

  const form = useForm<ContactMessageInput>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      subject: isValidSubject(subjectParam) ? subjectParam : 'General enquiry',
      message: tourName ? `I'd like to book the "${tourName}" tour. Please let me know availability and next steps.` : '',
    },
  });

  const onSubmit = async (values: ContactMessageInput) => {
    try {
      await submitMessage.mutateAsync(values);
    } catch {
      // surfaced inline below via submitMessage.isError
    }
  };

  return (
    <div className="bg-background pb-section-gap">
      <div className="container max-w-[920px]">
        <Reveal className="mb-12 text-center">
          <h1 className="font-serif text-3xl md:text-4xl mb-3">Get in touch</h1>
          <p className="text-muted-foreground text-lg">We'd love to hear from you — questions, feedback, or partnership ideas.</p>
        </Reveal>

        {submitMessage.isSuccess ? (
          <Reveal>
            <div className="glass-panel p-12 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center badge-success">
                <CheckCircle size={28} />
              </div>
              <h2 className="font-serif text-2xl mb-3">Message sent</h2>
              <p className="text-muted-foreground">
                Thanks for reaching out — our team has received your message and will get back to you shortly.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <Reveal className="md:col-span-2">
              <div className="glass-panel p-7 md:p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <select {...field} className="input-luxury">
                              {SUBJECTS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea rows={5} placeholder="Tell us how we can help..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {submitMessage.isError && (
                      <p className="text-sm font-medium text-destructive">
                        {submitMessage.error instanceof TRPCClientError
                          ? submitMessage.error.message
                          : 'Could not send your message. Please try again.'}
                      </p>
                    )}

                    <Magnetic className="block w-full">
                      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Sending...' : 'Send message'}
                      </Button>
                    </Magnetic>
                  </form>
                </Form>
              </div>
            </Reveal>

            <Reveal delay={0.1} className="md:col-span-1">
              <div className="glass-panel p-7 space-y-6 md:sticky md:top-[126px]">
                <div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Mail size={16} className="text-primary" />
                  </div>
                  <p className="label-field mb-1">Email</p>
                  <p className="text-sm">hello@lumierestays.com</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Phone size={16} className="text-primary" />
                  </div>
                  <p className="label-field mb-1">Phone</p>
                  <p className="text-sm">+1 (415) 555-0148</p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <MapPin size={16} className="text-primary" />
                  </div>
                  <p className="label-field mb-1">Studio</p>
                  <p className="text-sm">148 Market Street, San Francisco, CA</p>
                </div>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
