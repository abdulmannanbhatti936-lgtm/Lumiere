import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TRPCClientError } from '@trpc/client';
import { destinationWriteSchema, type DestinationWriteInput, type DestinationWriteFormInput } from '@shared/validation';
import { trpc, type RouterOutputs } from '@/lib/trpc';
import AdminLayout from '@/components/admin/AdminLayout';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type Destination = RouterOutputs['destinations']['list'][number];

const EMPTY_FORM: DestinationWriteInput = { name: '', country: '', description: '', imageUrl: '', featured: false };

export default function AdminDestinations() {
  const utils = trpc.useUtils();
  const { data: destinations, isLoading } = trpc.destinations.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<DestinationWriteFormInput, unknown, DestinationWriteInput>({
    resolver: zodResolver(destinationWriteSchema),
    defaultValues: EMPTY_FORM,
  });

  const invalidate = () => utils.destinations.list.invalidate();
  const createDestination = trpc.destinations.create.useMutation({ onSuccess: invalidate });
  const updateDestination = trpc.destinations.update.useMutation({ onSuccess: invalidate });
  const removeDestination = trpc.destinations.remove.useMutation({ onSuccess: invalidate });

  const openCreateDialog = () => {
    setEditingDestination(null);
    form.reset(EMPTY_FORM);
    setServerError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (destination: Destination) => {
    setEditingDestination(destination);
    form.reset({
      name: destination.name,
      country: destination.country,
      description: destination.description ?? '',
      imageUrl: destination.imageUrl ?? '',
      latitude: destination.latitude ? Number(destination.latitude) : undefined,
      longitude: destination.longitude ? Number(destination.longitude) : undefined,
      featured: destination.featured,
    });
    setServerError(null);
    setDialogOpen(true);
  };

  const onSubmit = async (values: DestinationWriteInput) => {
    setServerError(null);
    const payload = { ...values, imageUrl: values.imageUrl || undefined };
    try {
      if (editingDestination) {
        await updateDestination.mutateAsync({ id: editingDestination.id, ...payload });
      } else {
        await createDestination.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (err) {
      setServerError(err instanceof TRPCClientError ? err.message : 'Could not save this destination.');
    }
  };

  const handleDelete = async (destination: Destination) => {
    if (!confirm(`Delete "${destination.name}"? Hotels linked to it will be unlinked, not deleted.`)) return;
    try {
      await removeDestination.mutateAsync({ id: destination.id });
    } catch (err) {
      alert(err instanceof TRPCClientError ? err.message : 'Could not delete this destination.');
    }
  };

  const isSaving = createDestination.isPending || updateDestination.isPending;

  return (
    <AdminLayout>
      <Reveal className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <span className="label-caps mb-2 block">Global Portfolio</span>
          <h1 className="font-serif text-4xl">Manage Destinations</h1>
        </div>
        <Magnetic>
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus size={18} /> Add Destination
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
          ) : destinations && destinations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Country</th>
                    <th className="text-left py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Featured</th>
                    <th className="text-right py-3 px-4 label-caps !text-[10px] !text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {destinations.map((destination) => (
                    <tr key={destination.id} className="border-b border-border hover:bg-muted/60 transition-colors">
                      <td className="py-4 px-4 font-semibold">{destination.name}</td>
                      <td className="py-4 px-4 text-muted-foreground">{destination.country}</td>
                      <td className="py-4 px-4">
                        {destination.featured ? (
                          <span className="px-3 py-1 rounded-sm text-xs font-semibold bg-accent/10 text-accent">Featured</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditDialog(destination)}>
                            <Pencil size={18} />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(destination)}>
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
            <p className="text-muted-foreground text-center py-12">No destinations yet — add the first one.</p>
          )}
        </div>
      </Reveal>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-panel max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">
              {editingDestination ? `Edit ${editingDestination.name}` : 'Add Destination'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
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
                name="description"
                render={({ field }) => (
                  <FormItem>
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
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-4 h-4 accent-accent"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Featured destination</FormLabel>
                  </FormItem>
                )}
              />

              {serverError && <p className="text-sm font-medium text-destructive">{serverError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Magnetic>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : editingDestination ? 'Save Changes' : 'Create Destination'}
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
