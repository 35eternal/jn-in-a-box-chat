import { useState, useEffect } from "react";
import {
  fetchAllWebhooks,
  addWebhook,
  updateWebhook,
  deleteWebhook,
  toggleWebhookActive,
  type Webhook,
  type ServiceResponse,
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
      const result = await addWebhook(formData.name, formData.url, formData.priority) as ServiceResponse<Webhook>;
      if (result.success && result.data) {
        toast({
          title: "Success",
          description: "Webhook added successfully",
        });
        setIsAddDialogOpen(false);
        resetForm();
        loadWebhooks();
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add webhook - unknown error",
          variant: "destructive",
        });
      }
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
      const result = await updateWebhook(selectedWebhook.id, {
        name: formData.name,
        url: formData.url,
        priority: formData.priority,
      }) as ServiceResponse<Webhook>;
      if (result.success && result.data) {
        toast({
          title: "Success",
          description: "Webhook updated successfully",
        });
        setIsEditDialogOpen(false);
        setSelectedWebhook(null);
        resetForm();
        loadWebhooks();
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update webhook - unknown error",
          variant: "destructive",
        });
      }
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
      const result = await deleteWebhook(selectedWebhook.id) as ServiceResponse<null>;
      if (result.success) {
        toast({
          title: "Success",
          description: "Webhook deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setSelectedWebhook(null);
        loadWebhooks();
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete webhook - unknown error",
          variant: "destructive",
        });
      }
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
      const result = await toggleWebhookActive(webhook.id) as ServiceResponse<Webhook>;
      if (result.success && result.data) {
        toast({
          title: "Success",
          description: `Webhook ${webhook.is_active ? "deactivated" : "activated"} successfully`,
        });
        loadWebhooks();
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to toggle webhook status - unknown error",
          variant: "destructive",
        });
      }
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
          <h2 className="text-2xl font-bold text-foreground">Webhook Management</h2>
          <p className="text-muted-foreground text-sm">
            Manage AI webhook endpoints with automatic failover
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          variant="default"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {/* Table */}
      {webhooks.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No webhooks configured yet</p>
            <Button
              onClick={openAddDialog}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted">
                <TableHead className="text-foreground">Name</TableHead>
                <TableHead className="text-foreground">URL</TableHead>
                <TableHead className="text-foreground">Status</TableHead>
                <TableHead className="text-foreground">Priority</TableHead>
                <TableHead className="text-foreground">Created</TableHead>
                <TableHead className="text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow
                  key={webhook.id}
                  className="border-border hover:bg-muted transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      {webhook.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {webhook.url}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={() => handleToggleActive(webhook)}
                      />
                      <Badge
                        variant={webhook.is_active ? "default" : "secondary"}
                        className={
                          webhook.is_active
                            ? "bg-primary text-primary-foreground border-primary/30"
                            : "bg-secondary text-secondary-foreground border-secondary"
                        }
                      >
                        {webhook.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" />
                      {webhook.priority}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(webhook.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(webhook)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(webhook)}
                        variant="destructive"
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
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Webhook" : "Add Webhook"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isEditDialogOpen
                ? "Update the webhook configuration"
                : "Add a new webhook endpoint for AI responses"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Primary AI Webhook"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              {formErrors.name && (
                <p className="text-destructive text-sm">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="url" className="text-foreground">
                URL
              </Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://example.com/webhook"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              {formErrors.url && (
                <p className="text-destructive text-sm">{formErrors.url}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-foreground">
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
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              {formErrors.priority && (
                <p className="text-destructive text-sm">{formErrors.priority}</p>
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
            >
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleEditWebhook : handleAddWebhook}
              disabled={isSubmitting}
              variant="default"
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
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the webhook "
              {selectedWebhook?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWebhook}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
