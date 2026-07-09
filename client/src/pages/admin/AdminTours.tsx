import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TRPCClientError } from '@trpc/client';
import { tourWriteSchema, type TourWriteInput, type TourWriteFormInput } from '@shared/validation';
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

type Tour = RouterOutputs['tours']['list'][number];

const EMPTY_FORM: TourWriteInput = {
  destinationId: 0,
  name: '',
  description: '',
  category: 'Adventure',
  durationDays: 1,
  groupSize: 10,
  pricePerPerson: 0,
  imageUrl: '',
  images: [],
};

export default function AdminTours() {
  const utils = trpc.useUtils();
  const { data: tours, isLoading } = trpc.tours.list.useQuery();
  const { data: destinations } = trpc.destinations.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<TourWriteFormInput, unknown, TourWriteInput>({
    resolver: zodResolver(tourWriteSchema),
    defaultValues: EMPTY_FORM,
  });

  const invalidate = () => utils.tours.list.invalidate();
  const createTour = trpc.tours.create.useMutation({ onSuccess: invalidate });
  const updateTour = trpc.tours.update.useMutation({ onSuccess: invalidate });
  const removeTour = trpc.tours.remove.useMutation({ onSuccess: invalidate });

  const openCreateDialog = () => {
    setEditingTour(null);
    form.reset({ ...EMPTY_FORM, destinationId: destinations?.[0]?.id ?? 0 });
    setServerError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (tour: Tour) => {
    setEditingTour(tour);
    form.reset({
      destinationId: tour.destinationId,
      name: tour.name,
      description: tour.description ?? '',
      category: tour.category,
      durationDays: tour.durationDays,
      groupSize: tour.groupSize,
      pricePerPerson: Number(tour.pricePerPerson),
      imageUrl: tour.imageUrl ?? '',
      images: tour.images,
    });
    setServerError(null);
    setDialogOpen(true);
  };

  const onSubmit = async (values: TourWriteInput) => {
    setServerError(null);
    const payload = { ...values, imageUrl: values.imageUrl || undefined };
    try {
      if (editingTour) {
        await updateTour.mutateAsync({ id: editingTour.id, ...payload });
      } else {
        await createTour.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (err) {
      setServerError(err instanceof TRPCClientError ? err.message : 'Could not save this tour.');
    }
  };

  const handleDelete = async (tour: Tour) => {
    if (!confirm(`Delete "${tour.name}"? This cannot be undone.`)) return;
    try {
      await removeTour.mutateAsync({ id: tour.id });
    } catch (err) {
      alert(err instanceof TRPCClientError ? err.message : 'Could not delete this tour.');
    }
  };

  const isSaving = createTour.isPending || updateTour.isPending;

  return (
    <AdminLayout>
      <Reveal className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <span className="label-field mb-2 block">Experiences</span>
          <h1 className="font-serif text-4xl">Manage tours</h1>
        </div>
        <Magnetic>
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus size={18} /> Add tour
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
          ) : tours && tours.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 label-field">Name</th>
                    <th className="text-left py-3 px-4 label-field">Destination</th>
                    <th className="text-left py-3 px-4 label-field">Category</th>
                    <th className="text-left py-3 px-4 label-field">Duration</th>
                    <th className="text-left py-3 px-4 label-field">Price</th>
                    <th className="text-right py-3 px-4 label-field">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map((tour) => (
                    <tr key={tour.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                      <td className="py-4 px-4 font-semibold">{tour.name}</td>
                      <td className="py-4 px-4 text-muted-foreground">{tour.destination.name}</td>
                      <td className="py-4 px-4 text-muted-foreground">{tour.category}</td>
                      <td className="py-4 px-4 text-muted-foreground">{tour.durationDays}d</td>
                      <td className="py-4 px-4 text-muted-foreground">{formatCurrency(Number(tour.pricePerPerson))}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditDialog(tour)}>
                            <Pencil size={18} />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(tour)}>
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
            <p className="text-muted-foreground text-center py-12">No tours yet — add your first one.</p>
          )}
        </div>
      </Reveal>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">
              {editingTour ? `Edit ${editingTour.name}` : 'Add tour'}
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
                  name="destinationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <select
                          className="input-luxury"
                          value={field.value as number}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        >
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
                        <Input placeholder="Adventure, Small group..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (days)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} value={field.value as number | string} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="groupSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max group size</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} value={field.value as number | string} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pricePerPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price / person</FormLabel>
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
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {serverError && <p className="text-sm font-medium text-destructive">{serverError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Magnetic>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : editingTour ? 'Save changes' : 'Create tour'}
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
