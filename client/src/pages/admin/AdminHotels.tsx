import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'wouter';
import { Plus, Pencil, Trash2, BedDouble } from 'lucide-react';
import { toast } from 'sonner';
import { TRPCClientError } from '@trpc/client';
import { hotelWriteSchema, type HotelWriteInput, type HotelWriteFormInput } from '@shared/validation';
import { trpc, type RouterOutputs } from '@/lib/trpc';
import { formatCurrency } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type Hotel = RouterOutputs['hotels']['list']['items'][number];

const EMPTY_FORM: HotelWriteInput = {
  name: '',
  city: '',
  country: '',
  description: '',
  category: 'city',
  starRating: 5,
  basePrice: 0,
  imageUrl: '',
  images: [],
  amenities: [],
};

export default function AdminHotels() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.hotels.list.useQuery({ page: 1, limit: 50, sortBy: 'newest' });
  const { data: destinations } = trpc.destinations.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [imagesText, setImagesText] = useState('');
  const [amenitiesText, setAmenitiesText] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<HotelWriteFormInput, unknown, HotelWriteInput>({
    resolver: zodResolver(hotelWriteSchema),
    defaultValues: EMPTY_FORM,
  });

  const createHotel = trpc.hotels.create.useMutation({ onSuccess: () => utils.hotels.list.invalidate() });
  const updateHotel = trpc.hotels.update.useMutation({ onSuccess: () => utils.hotels.list.invalidate() });
  const removeHotel = trpc.hotels.remove.useMutation({ onSuccess: () => utils.hotels.list.invalidate() });

  const openCreateDialog = () => {
    setEditingHotel(null);
    form.reset(EMPTY_FORM);
    setImagesText('');
    setAmenitiesText('');
    setServerError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (hotel: Hotel) => {
    setEditingHotel(hotel);
    form.reset({
      destinationId: hotel.destinationId,
      name: hotel.name,
      city: hotel.city,
      country: hotel.country,
      description: hotel.description ?? '',
      category: hotel.category,
      starRating: hotel.starRating,
      basePrice: Number(hotel.basePrice),
      imageUrl: hotel.imageUrl ?? '',
      images: hotel.images,
      amenities: hotel.amenities,
      latitude: hotel.latitude ? Number(hotel.latitude) : undefined,
      longitude: hotel.longitude ? Number(hotel.longitude) : undefined,
    });
    setImagesText(hotel.images.join(', '));
    setAmenitiesText(hotel.amenities.join(', '));
    setServerError(null);
    setDialogOpen(true);
  };

  const onSubmit = async (values: HotelWriteInput) => {
    setServerError(null);
    const payload = {
      ...values,
      images: imagesText.split(',').map((s) => s.trim()).filter(Boolean),
      amenities: amenitiesText.split(',').map((s) => s.trim()).filter(Boolean),
      imageUrl: values.imageUrl || undefined,
    };

    try {
      if (editingHotel) {
        await updateHotel.mutateAsync({ id: editingHotel.id, ...payload });
      } else {
        await createHotel.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (err) {
      setServerError(err instanceof TRPCClientError ? err.message : 'Could not save this hotel.');
    }
  };

  const handleDelete = async (hotel: Hotel) => {
    if (!confirm(`Delete "${hotel.name}"? This cannot be undone.`)) return;
    try {
      await removeHotel.mutateAsync({ id: hotel.id });
      toast.success('Hotel deleted.');
    } catch (err) {
      toast.error(err instanceof TRPCClientError ? err.message : 'Could not delete this hotel.');
    }
  };

  const isSaving = createHotel.isPending || updateHotel.isPending;

  return (
    <AdminLayout>
      <Reveal className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <span className="label-caps mb-2 block">Inventory</span>
          <h1 className="font-serif text-4xl">Manage Hotels</h1>
        </div>
        <Magnetic>
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus size={18} /> Add Hotel
          </Button>
        </Magnetic>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="glass-panel p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Location</th>
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Stars</th>
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Base Price</th>
                    <th className="text-right py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((hotel) => (
                    <tr key={hotel.id} className="border-b border-border hover:bg-muted/60 transition-colors">
                      <td className="py-4 px-4 font-semibold">{hotel.name}</td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {hotel.city}, {hotel.country}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{hotel.starRating}★</td>
                      <td className="py-4 px-4 text-muted-foreground">{formatCurrency(Number(hotel.basePrice))}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/hotels/${hotel.id}/rooms`}>
                            <Button variant="ghost" size="icon" title="Manage rooms">
                              <BedDouble size={18} />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditDialog(hotel)}>
                            <Pencil size={18} />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(hotel)}>
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
            <p className="text-muted-foreground text-center py-12">No hotels yet — add your first one.</p>
          )}
        </div>
      </Reveal>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-panel max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">
              {editingHotel ? `Edit ${editingHotel.name}` : 'Add Hotel'}
            </DialogTitle>
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
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destinationId"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <select
                          className="input-luxury"
                          value={(field.value as number | null | undefined) ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        >
                          <option value="">None</option>
                          {destinations?.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}, {d.country}
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <select className="input-luxury" {...field}>
                          <option value="beach">Beach</option>
                          <option value="city">City</option>
                          <option value="mountain">Mountain</option>
                          <option value="boutique">Boutique</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="starRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Star Rating</FormLabel>
                      <FormControl>
                        <select
                          className="input-luxury"
                          value={field.value as number}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n} star{n > 1 ? 's' : ''}
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
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price / night</FormLabel>
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
                    <Input value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} placeholder="WiFi, Pool, Spa" />
                  </FormControl>
                </FormItem>
              </div>

              {serverError && <p className="text-sm font-medium text-destructive">{serverError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Magnetic>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : editingHotel ? 'Save Changes' : 'Create Hotel'}
                  </Button>
                </Magnetic>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
