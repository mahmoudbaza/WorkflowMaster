import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { toast } = useToast();
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFields, setFormFields] = useState<{id: string, label: string, type: string, required: boolean}[]>([]);
  const [currentFieldLabel, setCurrentFieldLabel] = useState("");
  const [currentFieldType, setCurrentFieldType] = useState("text");
  const [currentFieldRequired, setCurrentFieldRequired] = useState(false);

  const { data: requestTypes, isLoading: requestTypesLoading } = useQuery({
    queryKey: ["/api/admin/request-types"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/admin/workflows"],
  });

  const addField = () => {
    if (!currentFieldLabel) {
      toast({
        title: "Field label is required",
        description: "Please enter a label for the field",
        variant: "destructive",
      });
      return;
    }

    const newField = {
      id: Date.now().toString(),
      label: currentFieldLabel,
      type: currentFieldType,
      required: currentFieldRequired,
    };

    setFormFields([...formFields, newField]);
    setCurrentFieldLabel("");
    setCurrentFieldType("text");
    setCurrentFieldRequired(false);
  };

  const removeField = (id: string) => {
    setFormFields(formFields.filter(field => field.id !== id));
  };

  const handleCreateForm = () => {
    if (!formName) {
      toast({
        title: "Form name is required",
        description: "Please enter a name for the form",
        variant: "destructive",
      });
      return;
    }

    if (formFields.length === 0) {
      toast({
        title: "Fields are required",
        description: "Please add at least one field to the form",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Form created successfully",
      description: `The form "${formName}" has been created`,
    });

    // Reset form state
    setFormName("");
    setFormDescription("");
    setFormFields([]);
  };

  const renderRequestTypesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">Request Types</h3>
        <Button>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Type
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700 text-base">Available Request Types</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Approvers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requestTypesLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-32"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-24"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-16"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-20"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-16"></div></TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  <TableRow>
                    <TableCell className="font-medium">IT Equipment Request</TableCell>
                    <TableCell>IT</TableCell>
                    <TableCell>8</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Vacation Request</TableCell>
                    <TableCell>HR</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Budget Approval</TableCell>
                    <TableCell>Finance</TableCell>
                    <TableCell>10</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700 text-base">Create Request Type</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="form-name">Form Name</Label>
              <Input 
                id="form-name" 
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter form name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-department">Department</Label>
              <Select>
                <SelectTrigger id="form-department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="form-description">Description</Label>
            <Textarea 
              id="form-description" 
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Enter form description"
              rows={3}
            />
          </div>

          <div className="border rounded-md p-4 bg-neutral-50">
            <h4 className="font-medium mb-3">Add Field</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field-label">Label</Label>
                <Input 
                  id="field-label" 
                  value={currentFieldLabel}
                  onChange={(e) => setCurrentFieldLabel(e.target.value)}
                  placeholder="Enter field label"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field-type">Type</Label>
                <Select value={currentFieldType} onValueChange={setCurrentFieldType}>
                  <SelectTrigger id="field-type">
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="file">File Upload</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch 
                  id="field-required" 
                  checked={currentFieldRequired}
                  onCheckedChange={setCurrentFieldRequired}
                />
                <Label htmlFor="field-required">Required</Label>
                <Button className="ml-auto" onClick={addField}>Add Field</Button>
              </div>
            </div>
          </div>

          {formFields.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formFields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell>{field.label}</TableCell>
                      <TableCell>{field.type}</TableCell>
                      <TableCell>{field.required ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => removeField(field.id)}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="border rounded-md p-4 bg-neutral-50">
            <h4 className="font-medium mb-3">Approval Workflow</h4>
            <div className="space-y-2">
              <Label>Define Approvers</Label>
              <p className="text-sm text-neutral-500 mb-3">Specify who needs to approve this request type and in what order.</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">1</span>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select approver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Direct Manager</SelectItem>
                      <SelectItem value="department">Department Head</SelectItem>
                      <SelectItem value="it-admin">IT Administrator</SelectItem>
                      <SelectItem value="hr-manager">HR Manager</SelectItem>
                      <SelectItem value="finance-director">Finance Director</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
                
                <Button variant="outline" size="sm" className="ml-9">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Approver
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-neutral-200 bg-neutral-50 p-4">
          <Button variant="outline" className="mr-2">Cancel</Button>
          <Button onClick={handleCreateForm}>Create Form</Button>
        </CardFooter>
      </Card>
    </div>
  );

  const renderWorkflowsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">Workflow Management</h3>
        <Button>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Workflow
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700 text-base">Active Workflows</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow Name</TableHead>
                <TableHead>Associated Form</TableHead>
                <TableHead>Steps</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflowsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-32"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-24"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-16"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-20"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-16"></div></TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  <TableRow>
                    <TableCell className="font-medium">New Employee Onboarding</TableCell>
                    <TableCell>HR Onboarding Form</TableCell>
                    <TableCell>4</TableCell>
                    <TableCell>5 days</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Budget Approval Process</TableCell>
                    <TableCell>Budget Request Form</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>3 days</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">IT Access Request</TableCell>
                    <TableCell>IT Access Form</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>1 day</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700 text-base">Workflow Designer</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-neutral-300 rounded-md">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              <p className="mt-1 text-sm text-neutral-500">Visual workflow designer coming soon</p>
              <p className="mt-1 text-xs text-neutral-400">Drag and drop interface for creating complex approval workflows</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">User Management</h3>
        <Button>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700 text-base">System Users</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex mb-4">
            <Input placeholder="Search users..." className="max-w-sm" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-32"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-40"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-24"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-20"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-16"></div></TableCell>
                    <TableCell><div className="h-4 bg-neutral-200 rounded w-16"></div></TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  <TableRow>
                    <TableCell className="font-medium">John Smith</TableCell>
                    <TableCell>john.smith@company.com</TableCell>
                    <TableCell>IT</TableCell>
                    <TableCell>Administrator</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Deactivate</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Sarah Johnson</TableCell>
                    <TableCell>sarah.johnson@company.com</TableCell>
                    <TableCell>HR</TableCell>
                    <TableCell>Manager</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Deactivate</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Michael Wong</TableCell>
                    <TableCell>michael.wong@company.com</TableCell>
                    <TableCell>Finance</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Deactivate</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Emily Davis</TableCell>
                    <TableCell>emily.davis@company.com</TableCell>
                    <TableCell>Marketing</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Deactivate</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">David Williams</TableCell>
                    <TableCell>david.williams@company.com</TableCell>
                    <TableCell>Legal</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Activate</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700 text-base">Role Management</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Available Roles</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Administrator</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Manager</TableCell>
                    <TableCell>8</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">User</TableCell>
                    <TableCell>42</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div>
              <h4 className="font-medium mb-3">Create New Role</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role-name">Role Name</Label>
                  <Input id="role-name" placeholder="Enter role name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-description">Description</Label>
                  <Textarea id="role-description" placeholder="Enter role description" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="perm-view-requests" />
                      <Label htmlFor="perm-view-requests">View Requests</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="perm-create-requests" />
                      <Label htmlFor="perm-create-requests">Create Requests</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="perm-approve-requests" />
                      <Label htmlFor="perm-approve-requests">Approve Requests</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="perm-manage-users" />
                      <Label htmlFor="perm-manage-users">Manage Users</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="perm-manage-forms" />
                      <Label htmlFor="perm-manage-forms">Manage Forms</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="perm-system-config" />
                      <Label htmlFor="perm-system-config">System Configuration</Label>
                    </div>
                  </div>
                </div>
                <Button>Create Role</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnnouncementsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">Announcement Management</h3>
        <Button>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Announcement
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700 text-base">Create Announcement</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="announcement-title">Title</Label>
            <Input id="announcement-title" placeholder="Enter announcement title" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="announcement-content">Content</Label>
            <Textarea id="announcement-content" placeholder="Enter announcement content" rows={5} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-image">Image URL (optional)</Label>
              <Input id="announcement-image" placeholder="Enter image URL" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="announcement-target">Target Audience</Label>
              <Select>
                <SelectTrigger id="announcement-target">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="it">IT Department</SelectItem>
                  <SelectItem value="hr">HR Department</SelectItem>
                  <SelectItem value="finance">Finance Department</SelectItem>
                  <SelectItem value="managers">Managers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-expiry">Expiry Date (optional)</Label>
              <Input id="announcement-expiry" type="date" />
            </div>
            
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch id="send-email" />
                  <Label htmlFor="send-email">Send as Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="mark-important" />
                  <Label htmlFor="mark-important">Mark as Important</Label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="announcement-attachments">Attachments</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-neutral-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none">
                    <span>Upload files</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-neutral-500">
                  PDF, DOC, XLS, PNG, JPG up to 10MB
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-neutral-200 bg-neutral-50 p-4">
          <Button variant="outline" className="mr-2">Cancel</Button>
          <Button>Publish Announcement</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700 text-base">Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Quarterly All-Hands Meeting</TableCell>
                <TableCell>HR Department</TableCell>
                <TableCell>Sep 10, 2023</TableCell>
                <TableCell>All Users</TableCell>
                <TableCell>145</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">New Internal Portal System Launch</TableCell>
                <TableCell>IT Department</TableCell>
                <TableCell>Sep 5, 2023</TableCell>
                <TableCell>All Users</TableCell>
                <TableCell>183</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Updated Security Policy</TableCell>
                <TableCell>IT Security</TableCell>
                <TableCell>Aug 28, 2023</TableCell>
                <TableCell>All Users</TableCell>
                <TableCell>122</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-700">Administration</h2>
        <p className="text-neutral-500 mt-1">Configure and manage the portal system</p>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Request Types</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests" className="mt-0">
          {renderRequestTypesTab()}
        </TabsContent>
        
        <TabsContent value="workflows" className="mt-0">
          {renderWorkflowsTab()}
        </TabsContent>
        
        <TabsContent value="users" className="mt-0">
          {renderUsersTab()}
        </TabsContent>
        
        <TabsContent value="announcements" className="mt-0">
          {renderAnnouncementsTab()}
        </TabsContent>
        
        <TabsContent value="homepage" className="mt-0">
          <Card className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-neutral-900">Homepage Configuration</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Configure homepage elements, quick links, and dashboard panels
              </p>
              <div className="mt-6">
                <Button>Configure Homepage</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Admin;
