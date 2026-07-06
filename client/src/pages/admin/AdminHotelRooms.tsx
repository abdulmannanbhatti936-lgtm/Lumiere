import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRoute, Link } from 'wouter';
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { TRPCClientError } from '@trpc/client';
import { roomWriteSchema, type RoomWriteInput, type RoomWriteFormInput } from '@shared/validation';
import { trpc, type RouterOutputs } from '@/lib/trpc';
import { formatCurrency } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type Room = RouterOutputs['rooms']['listByHotel'][number];

export default function AdminHotelRooms() {
  const [, params] = useRoute('/admin/hotels/:hotelId/rooms');
  const hotelId = Number(params?.hotelId);

  const utils = trpc.useUtils();
  const { data: hotel } = trpc.hotels.getById.useQuery({ id: hotelId }, { enabled: Number.isFinite(hotelId) });
  const { data: rooms, isLoading } = trpc.rooms.listByHotel.useQuery({ hotelId }, { enabled: Number.isFinite(hotelId) });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [imagesText, setImagesText] = useState('');
  const [amenitiesText, setAmenitiesText] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RoomWriteFormInput, unknown, RoomWriteInput>({
    resolver: zodResolver(roomWriteSchema),
    defaultValues: { hotelId, name: '', capacity: 2, pricePerNight: 0, totalUnits: 1, images: [], amenities: [] },
  });

  const invalidate = () => utils.rooms.listByHotel.invalidate({ hotelId });
  const createRoom = trpc.rooms.create.useMutation({ onSuccess: invalidate });
  const updateRoom = trpc.rooms.update.useMutation({ onSuccess: invalidate });
  const removeRoom = trpc.rooms.remove.useMutation({ onSuccess: invalidate });

  const openCreateDialog = () => {
    setEditingRoom(null);
    form.reset({ hotelId, name: '', capacity: 2, pricePerNight: 0, totalUnits: 1, images: [], amenities: [] });
    setImagesText('');
    setAmenitiesText('');
    setServerError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (room: Room) => {
    setEditingRoom(room);
    form.reset({
      hotelId,
      name: room.name,
      description: room.description ?? '',
      capacity: room.capacity,
      pricePerNight: Number(room.pricePerNight),
      totalUnits: room.totalUnits,
      imageUrl: room.imageUrl ?? '',
      images: room.images,
      amenities: room.amenities,
    });
    setImagesText(room.images.join(', '));
    setAmenitiesText(room.amenities.join(', '));
    setServerError(null);
    setDialogOpen(true);
  };

  const onSubmit = async (values: RoomWriteInput) => {
    setServerError(null);
    const payload = {
      ...values,
      hotelId,
      images: imagesText.split(',').map((s) => s.trim()).filter(Boolean),
      amenities: amenitiesText.split(',').map((s) => s.trim()).filter(Boolean),
      imageUrl: values.imageUrl || undefined,
    };

    try {
      if (editingRoom) {
        await updateRoom.mutateAsync({ id: editingRoom.id, ...payload });
      } else {
        await createRoom.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (err) {
      setServerError(err instanceof TRPCClientError ? err.message : 'Could not save this room.');
    }
  };

  const handleDelete = async (room: Room) => {
    if (!confirm(`Delete "${room.name}"? This cannot be undone.`)) return;
    try {
      await removeRoom.mutateAsync({ id: room.id });
    } catch (err) {
      alert(err instanceof TRPCClientError ? err.message : 'Could not delete this room.');
    }
  };

  const isSaving = createRoom.isPending || updateRoom.isPending;

  return (
    <AdminLayout>
      <div className="mb-8">
        <Link href="/admin/hotels" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={18} /> Back to Hotels
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Rooms — {hotel?.name ?? '...'}</h1>
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus size={18} /> Add Room
          </Button>
        </div>
      </div>

      <div className="card-luxury">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-accent" />
          </div>
        ) : rooms && rooms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Capacity</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Price/night</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Units</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 font-semibold">{room.name}</td>
                    <td className="py-4 px-4 text-muted-foreground">{room.capacity} guests</td>
                    <td className="py-4 px-4 text-muted-foreground">{formatCurrency(Number(room.pricePerNight))}</td>
                    <td className="py-4 px-4 text-muted-foreground">{room.totalUnits}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditDialog(room)}>
                          <Pencil size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(room)}>
                          <Trash2 size={18} className="text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No rooms yet — add the first one.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoom ? `Edit ${editingRoom.name}` : 'Add Room'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (guests)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="20" {...field} value={field.value as number | string} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalUnits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Units (inventory)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} value={field.value as number | string} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pricePerNight"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Price / night</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} value={field.value as number | string} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Main Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem className="col-span-2">
                  <FormLabel>Additional Image URLs (comma-separated)</FormLabel>
                  <FormControl>
                    <Input value={imagesText} onChange={(e) => setImagesText(e.target.value)} placeholder="https://..., https://..." />
                  </FormControl>
                </FormItem>
                <FormItem className="col-span-2">
                  <FormLabel>Amenities (comma-separated)</FormLabel>
                  <FormControl>
                    <Input value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} placeholder="WiFi, Mini Bar" />
                  </FormControl>
                </FormItem>
              </div>

              {serverError && <p className="text-sm font-medium text-destructive">{serverError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingRoom ? 'Save Changes' : 'Create Room'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
