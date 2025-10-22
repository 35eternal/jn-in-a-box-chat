import { useState, useEffect } from "react";
import {
  fetchAllWebhooks,
  addWebhook,
  updateWebhook,
  deleteWebhook,
  toggleWebhookActive,
  type Webhook,
} from "@/services/webhookService";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Edit,
  Trash2,
  Link as LinkIcon,
  ArrowUp,
  Loader2,
} from "lucide-react";

interface FormData {
  name: string;
  url: string;
  priority: number;
}

export const WebhookManager = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    url: "",
    priority: 0,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAllWebhooks();
      setWebhooks(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load webhooks",
        variant: "destructive",
      });
      console.error("Error loading webhooks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.url.trim()) {
      errors.url = "URL is required";
    } else {
      try {
        new URL(formData.url);
      } catch {
        errors.url = "Invalid URL format";
      }
    }

    if (formData.priority < 0) {
      errors.priority = "Priority must be non-negative";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddWebhook = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await addWebhook(formData.name, formData.url, formData.priority);
      toast({
        title: "Success",
        description: "Webhook added successfully",
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadWebhooks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add webhook",
        variant: "destructive",
      });
      console.error("Error adding webhook:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditWebhook = async () => {
    if (!selectedWebhook || !validateForm()) return;

    try {
      setIsSubmitting(true);
      await updateWebhook(selectedWebhook.id, {
        name: formData.name,
        url: formData.url,
        priority: formData.priority,
      });
      toast({
        title: "Success",
        description: "Webhook updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedWebhook(null);
      resetForm();
      loadWebhooks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update webhook",
        variant: "destructive",
      });
      console.error("Error updating webhook:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!selectedWebhook) return;

    try {
      await deleteWebhook(selectedWebhook.id);
      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedWebhook(null);
      loadWebhooks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
      console.error("Error deleting webhook:", error);
    }
  };

  const handleToggleActive = async (webhook: Webhook) => {
    try {
      await toggleWebhookActive(webhook.id);
      toast({
        title: "Success",
        description: `Webhook ${webhook.is_active ? "deactivated" : "activated"}`,
      });
      loadWebhooks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle webhook status",
        variant: "destructive",
      });
      console.error("Error toggling webhook:", error);
    }
  };

  const openAddDialog = () => {
    resetForm();
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      priority: webhook.priority,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", url: "", priority: 0 });
    setFormErrors({});
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Webhook Management</h2>
          <p className="text-white/70 text-sm">
            Manage AI webhook endpoints with automatic failover
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] hover:from-[hsl(153,60%,40%)] hover:to-[hsl(192,55%,40%)] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {/* Table */}
      {webhooks.length === 0 ? (
        <Card className="bg-[hsl(174,30%,20%)] border-white/10">
          <CardContent className="pt-6 text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-white/50 mb-4" />
            <p className="text-white/70 mb-4">No webhooks configured yet</p>
            <Button
              onClick={openAddDialog}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-white/10 bg-[hsl(174,30%,20%)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/90">Name</TableHead>
                <TableHead className="text-white/90">URL</TableHead>
                <TableHead className="text-white/90">Status</TableHead>
                <TableHead className="text-white/90">Priority</TableHead>
                <TableHead className="text-white/90">Created</TableHead>
                <TableHead className="text-white/90 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow
                  key={webhook.id}
                  className="border-white/10 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium text-white">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-white/50" />
                      {webhook.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70 max-w-xs truncate">
                    {webhook.url}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={() => handleToggleActive(webhook)}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <Badge
                        variant={webhook.is_active ? "default" : "secondary"}
                        className={
                          webhook.is_active
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }
                      >
                        {webhook.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" />
                      {webhook.priority}
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70">
                    {formatDate(webhook.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(webhook)}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(webhook)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedWebhook(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="bg-gradient-to-b from-[hsl(174,40%,18%)] to-[hsl(174,35%,15%)] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Webhook" : "Add Webhook"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {isEditDialogOpen
                ? "Update the webhook configuration"
                : "Add a new webhook endpoint for AI responses"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Primary AI Webhook"
                className="bg-[hsl(174,30%,20%)] border-white/20 text-white placeholder:text-white/50"
              />
              {formErrors.name && (
                <p className="text-red-400 text-sm">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="url" className="text-white">
                URL
              </Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://example.com/webhook"
                className="bg-[hsl(174,30%,20%)] border-white/20 text-white placeholder:text-white/50"
              />
              {formErrors.url && (
                <p className="text-red-400 text-sm">{formErrors.url}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-white">
                Priority (lower = higher priority)
              </Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                min="0"
                className="bg-[hsl(174,30%,20%)] border-white/20 text-white placeholder:text-white/50"
              />
              {formErrors.priority && (
                <p className="text-red-400 text-sm">{formErrors.priority}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setSelectedWebhook(null);
                resetForm();
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleEditWebhook : handleAddWebhook}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] hover:from-[hsl(153,60%,40%)] hover:to-[hsl(192,55%,40%)] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditDialogOpen ? (
                "Update"
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-gradient-to-b from-[hsl(174,40%,18%)] to-[hsl(174,35%,15%)] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This will permanently delete the webhook "
              {selectedWebhook?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWebhook}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
