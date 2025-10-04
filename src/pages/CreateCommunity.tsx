import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Globe, MapPin, ArrowLeft } from "lucide-react";
import type { Community } from "../../shared/schema";

const CreateCommunitySchema = z.object({
  name: z.string().min(1, "Community name is required").max(100, "Community name too long"),
  description: z.string().max(500, "Description too long"),
  category: z.string().min(1, "Category is required"),
  maxGeographicScope: z.enum(['neighborhood', 'city', 'state', 'national', 'global']).default('global'),
  tags: z.string().optional(),
  isPublic: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
});

type CreateCommunityForm = z.infer<typeof CreateCommunitySchema>;

export default function CreateCommunity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if user already has a community
  const { data: hasCommunityData } = useQuery<{ hasCommunity: boolean }>({
    queryKey: ["/api/user/has-community"],
    enabled: !!user,
  });

  const form = useForm<CreateCommunityForm>({
    resolver: zodResolver(CreateCommunitySchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      maxGeographicScope: "global",
      tags: "",
      isPublic: true,
      requiresApproval: false,
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: CreateCommunityForm) => {
      if (!user) throw new Error("User not authenticated");
      
      return apiRequest("/api/communities", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          tags: data.tags ? data.tags.split(",").map(tag => tag.trim()) : [],
        }),
      });
    },
    onSuccess: (community: Community) => {
      toast({
        title: "Community Created",
        description: "Your community has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/has-community"] });
      navigate(`/communities/${community.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create community",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCommunityForm) => {
    createCommunityMutation.mutate(data);
  };

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to create a community.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check if user already has a community
  if (hasCommunityData?.hasCommunity) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Community Limit Reached</CardTitle>
            <CardDescription>
              You already have a community. Each user can only create one community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/communities")} 
              className="w-full"
              data-testid="button-view-communities"
            >
              View My Communities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">Create Community</h1>
        <p className="text-muted-foreground">
          Create a new community to bring people together around shared interests or local activities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Details
          </CardTitle>
          <CardDescription>
            All communities start as global by default. Members can toggle between global and local views.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Local Hiking Group, Book Club, Tech Meetup" 
                        {...field} 
                        data-testid="input-community-name"
                      />
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
                      <Textarea
                        placeholder="Describe what your community is about, what activities you'll do, and who should join..."
                        rows={4}
                        {...field}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormDescription>
                      Help people understand what your community is about
                    </FormDescription>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="sports">Sports & Fitness</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="hobbies">Hobbies & Interests</SelectItem>
                        <SelectItem value="volunteering">Volunteering</SelectItem>
                        <SelectItem value="education">Education & Learning</SelectItem>
                        <SelectItem value="family">Family & Kids</SelectItem>
                        <SelectItem value="arts">Arts & Culture</SelectItem>
                        <SelectItem value="support">Support Groups</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxGeographicScope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Geographic Scope</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-max-scope">
                          <SelectValue placeholder="Select geographic scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="neighborhood">Neighborhood - Most Local</SelectItem>
                        <SelectItem value="city">City</SelectItem>
                        <SelectItem value="state">State/Province</SelectItem>
                        <SelectItem value="national">National</SelectItem>
                        <SelectItem value="global">Global - Worldwide</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Chat members can filter by this scope or smaller. Global is always available.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="hiking, outdoors, weekend (comma separated)" 
                        {...field} 
                        data-testid="input-tags"
                      />
                    </FormControl>
                    <FormDescription>
                      Add tags to help people find your community
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Community Settings</h3>
                
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-public"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Public Community
                        </FormLabel>
                        <FormDescription>
                          Anyone can find and join this community
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-approval"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Require Approval
                        </FormLabel>
                        <FormDescription>
                          New members need approval before joining
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Geographic Scope</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Set the maximum geographic scope for chat filtering</li>
                  <li>• Members can filter by your chosen scope or smaller regions</li>
                  <li>• Global chat is always available regardless of scope</li>
                  <li>• Example: State scope allows state, city, and neighborhood filters</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createCommunityMutation.isPending}
                data-testid="button-create-community"
              >
                {createCommunityMutation.isPending ? "Creating..." : "Create Community"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}