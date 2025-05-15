import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Config = () => {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  // Mock system logs (normally we'd fetch these from API)
  const systemLogs = [
    { id: 1, timestamp: "2023-09-12T14:32:45", level: "INFO", message: "System configuration updated", user: "john.smith" },
    { id: 2, timestamp: "2023-09-12T11:15:22", level: "WARNING", message: "Email service connection slow", user: "system" },
    { id: 3, timestamp: "2023-09-11T17:08:10", level: "ERROR", message: "Failed to connect to signature service", user: "system" },
    { id: 4, timestamp: "2023-09-11T09:23:55", level: "INFO", message: "New user added to system", user: "admin" },
    { id: 5, timestamp: "2023-09-10T16:45:12", level: "INFO", message: "Database backup completed", user: "system" },
  ];

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["/api/config"],
  });

  const updateConfigMutation = useMutation({
    mutationFn: (newConfig: any) => apiRequest("POST", "/api/config", newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({
        title: "Configuration saved",
        description: "Your changes have been applied successfully.",
      });
      setHasChanges(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save configuration changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveChanges = () => {
    // In a real system, we'd collect all the form values and send them
    updateConfigMutation.mutate({
      // Collected form values would go here
    });
  };

  const renderGeneralSettings = () => (
    <Card className="mb-6">
      <CardHeader className="px-4 py-3 border-b border-neutral-200">
        <CardTitle className="font-semibold text-neutral-700">General Settings</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="app-name">Portal Name</Label>
            <Input 
              id="app-name" 
              placeholder="Internal Portal"
              defaultValue="Internal Portal System"
              onChange={() => setHasChanges(true)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="app-port">Application Port</Label>
            <Input 
              id="app-port" 
              placeholder="7001" 
              defaultValue="7001"
              onChange={() => setHasChanges(true)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="app-url">Application URL</Label>
            <Input 
              id="app-url" 
              placeholder="https://internalportal.company.com"
              defaultValue="https://internalportal.company.com"
              onChange={() => setHasChanges(true)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="log-path">Log Path</Label>
            <Input 
              id="log-path" 
              placeholder="/var/log/portal"
              defaultValue="/var/log/portal"
              onChange={() => setHasChanges(true)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="attachment-path">Attachment Path</Label>
            <Input 
              id="attachment-path" 
              placeholder="/var/data/attachments"
              defaultValue="/var/data/attachments"
              onChange={() => setHasChanges(true)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-attachment-size">Max Attachment Size (MB)</Label>
            <Input 
              id="max-attachment-size" 
              type="number" 
              placeholder="10"
              defaultValue="10"
              onChange={() => setHasChanges(true)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="deploy-env">Deployment Environment</Label>
            <Select defaultValue="production" onValueChange={() => setHasChanges(true)}>
              <SelectTrigger id="deploy-env">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>System Features</Label>
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-2">
                <Switch id="enable-email-approvals" defaultChecked onChange={() => setHasChanges(true)} />
                <Label htmlFor="enable-email-approvals">Enable Email Approvals</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="debug-mode" onChange={() => setHasChanges(true)} />
                <Label htmlFor="debug-mode">Debug Mode</Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDatabaseSettings = () => (
    <Card className="mb-6">
      <CardHeader className="px-4 py-3 border-b border-neutral-200">
        <CardTitle className="font-semibold text-neutral-700">Database Configuration</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="db-connection-string">MS SQL Connection String</Label>
          <Input 
            id="db-connection-string" 
            placeholder="Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;"
            defaultValue="Server=localhost;Database=PortalDB;User Id=dbuser;Password=********;"
            type="password"
            onChange={() => setHasChanges(true)}
          />
          <p className="text-xs text-neutral-500 mt-1">
            Format: Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="db-host">Database Host</Label>
            <Input 
              id="db-host" 
              placeholder="localhost"
              defaultValue="localhost"
              onChange={() => setHasChanges(true)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="db-name">Database Name</Label>
            <Input 
              id="db-name" 
              placeholder="PortalDB"
              defaultValue="PortalDB"
              onChange={() => setHasChanges(true)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="db-port">Database Port</Label>
            <Input 
              id="db-port" 
              placeholder="1433"
              defaultValue="1433"
              onChange={() => setHasChanges(true)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="db-user">Database Username</Label>
            <Input 
              id="db-user" 
              placeholder="dbuser"
              defaultValue="dbuser"
              onChange={() => setHasChanges(true)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="db-password">Database Password</Label>
            <Input 
              id="db-password" 
              type="password"
              placeholder="********"
              defaultValue="********"
              onChange={() => setHasChanges(true)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Database Options</Label>
          <div className="space-y-2 pt-2">
            <div className="flex items-center space-x-2">
              <Switch id="use-integrated-security" onChange={() => setHasChanges(true)} />
              <Label htmlFor="use-integrated-security">Use Integrated Security</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="enable-pooling" defaultChecked onChange={() => setHasChanges(true)} />
              <Label htmlFor="enable-pooling">Enable Connection Pooling</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="encrypt-connection" defaultChecked onChange={() => setHasChanges(true)} />
              <Label htmlFor="encrypt-connection">Encrypt Connection</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700">Microsoft Integration</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Single Sign-On (SSO)</Label>
            <div className="flex items-center space-x-2 mb-4">
              <Switch id="use-sso" defaultChecked onChange={() => setHasChanges(true)} />
              <Label htmlFor="use-sso">Enable Microsoft Entra ID Authentication</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenant-id">Tenant ID</Label>
              <Input 
                id="tenant-id" 
                placeholder="00000000-0000-0000-0000-000000000000"
                defaultValue="38a2ef4c-42d7-4e41-9535-e5e2e4a48ea7"
                onChange={() => setHasChanges(true)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-id">Client ID</Label>
              <Input 
                id="client-id" 
                placeholder="00000000-0000-0000-0000-000000000000"
                defaultValue="6aef9375-8e26-4a48-ba24-c5c9cd65f4c8"
                onChange={() => setHasChanges(true)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client-secret">Client Secret</Label>
            <Input 
              id="client-secret" 
              type="password"
              placeholder="********"
              defaultValue="********"
              onChange={() => setHasChanges(true)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="redirect-uri">Redirect URI</Label>
            <Input 
              id="redirect-uri" 
              placeholder="https://internalportal.company.com/auth/callback"
              defaultValue="https://internalportal.company.com/auth/callback"
              onChange={() => setHasChanges(true)}
            />
          </div>
          
          <div className="space-y-2 border-t border-neutral-200 pt-4 mt-4">
            <Label>Email Integration</Label>
            <div className="flex items-center space-x-2 mb-4">
              <Switch id="use-ms-email" defaultChecked onChange={() => setHasChanges(true)} />
              <Label htmlFor="use-ms-email">Enable Microsoft 365 Email</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-sender">Sender Email</Label>
              <Input 
                id="email-sender" 
                placeholder="portal@company.com"
                defaultValue="portal@company.com"
                onChange={() => setHasChanges(true)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-sender-name">Sender Name</Label>
              <Input 
                id="email-sender-name" 
                placeholder="Internal Portal"
                defaultValue="Internal Portal System"
                onChange={() => setHasChanges(true)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700">Digital Signature Integration</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signature-provider">Signature Provider</Label>
            <Select defaultValue="docusign" onValueChange={() => setHasChanges(true)}>
              <SelectTrigger id="signature-provider">
                <SelectValue placeholder="Select signature provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adobe">Adobe Sign</SelectItem>
                <SelectItem value="docusign">DocuSign</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signature-api-key">API Key</Label>
            <Input 
              id="signature-api-key" 
              type="password"
              placeholder="********"
              defaultValue="********"
              onChange={() => setHasChanges(true)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signature-account-id">Account ID</Label>
            <Input 
              id="signature-account-id" 
              placeholder="00000000-0000-0000-0000-000000000000"
              defaultValue="f2a96e58-7c45-4d80-9b2a-cd807c28975f"
              onChange={() => setHasChanges(true)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signature-user-id">Integration User ID</Label>
            <Input 
              id="signature-user-id" 
              placeholder="user@company.com"
              defaultValue="admin@company.com"
              onChange={() => setHasChanges(true)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signature-base-uri">API Base URI</Label>
            <Input 
              id="signature-base-uri" 
              placeholder="https://api.docusign.com"
              defaultValue="https://api.docusign.com"
              onChange={() => setHasChanges(true)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Signature Storage</Label>
            <div className="flex items-center space-x-2">
              <Switch id="store-signatures-db" defaultChecked onChange={() => setHasChanges(true)} />
              <Label htmlFor="store-signatures-db">Store signed documents in database</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="store-signatures-file" defaultChecked onChange={() => setHasChanges(true)} />
              <Label htmlFor="store-signatures-file">Store signed documents in file system</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSystemLogs = () => (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-neutral-200">
        <CardTitle className="font-semibold text-neutral-700">System Logs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {systemLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.level === 'ERROR' 
                        ? 'bg-red-100 text-red-800' 
                        : log.level === 'WARNING' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {log.level}
                  </span>
                </TableCell>
                <TableCell>{log.message}</TableCell>
                <TableCell>{log.user}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="border-t border-neutral-200 bg-neutral-50 p-4 justify-between">
        <div className="flex items-center text-sm text-neutral-500">
          Showing latest 5 logs of 1,245 total entries
        </div>
        <Button variant="outline" size="sm">View All Logs</Button>
      </CardFooter>
    </Card>
  );

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700">Custom Configuration</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="config-yaml">Configuration YAML</Label>
            <Textarea 
              id="config-yaml" 
              className="font-mono text-sm"
              rows={12}
              onChange={() => setHasChanges(true)}
              defaultValue={`# Internal Portal System Configuration
APP_PORT: 7001
ATTACHMENT_PATH: /var/data/attachments
LOG_PATH: /var/log/portal
SIGNATURE_PROVIDER: docusign
ENABLE_EMAIL_APPROVALS: true
USE_SSO: true
MAX_ATTACHMENT_SIZE_MB: 10
DB_CONNECTION_STRING: Server=localhost;Database=PortalDB;User Id=dbuser;Password=********;
DEPLOY_ENV: production

# Microsoft Integration
MS_TENANT_ID: 38a2ef4c-42d7-4e41-9535-e5e2e4a48ea7
MS_CLIENT_ID: 6aef9375-8e26-4a48-ba24-c5c9cd65f4c8
MS_CLIENT_SECRET: ********
MS_REDIRECT_URI: https://internalportal.company.com/auth/callback

# Email Settings
EMAIL_SENDER: portal@company.com
EMAIL_SENDER_NAME: Internal Portal System

# Signature Settings
SIGNATURE_API_KEY: ********
SIGNATURE_ACCOUNT_ID: f2a96e58-7c45-4d80-9b2a-cd807c28975f
SIGNATURE_USER_ID: admin@company.com
SIGNATURE_BASE_URI: https://api.docusign.com
STORE_SIGNATURES_DB: true
STORE_SIGNATURES_FILE: true`}
            />
          </div>
          <p className="text-xs text-neutral-500">
            Edit the configuration directly in YAML format. Be careful as incorrect syntax may cause system issues.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700">System Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Restart Application
            </Button>
            <Button variant="outline" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Clear Cache
            </Button>
            <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-700">System Configuration</h2>
          <p className="text-neutral-500 mt-1">Configure system settings and integrations</p>
        </div>
        
        {hasChanges && (
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button variant="outline" onClick={() => setHasChanges(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges}
              disabled={updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-0">
          {configLoading ? (
            <Card className="mb-6 animate-pulse">
              <CardHeader className="px-4 py-3 border-b border-neutral-200">
                <div className="h-5 bg-neutral-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
                    <div className="h-10 bg-neutral-200 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
                    <div className="h-10 bg-neutral-200 rounded"></div>
                  </div>
                </div>
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-10 bg-neutral-200 rounded"></div>
              </CardContent>
            </Card>
          ) : (
            renderGeneralSettings()
          )}
        </TabsContent>
        
        <TabsContent value="database" className="mt-0">
          {renderDatabaseSettings()}
        </TabsContent>
        
        <TabsContent value="integrations" className="mt-0">
          {renderIntegrationSettings()}
        </TabsContent>
        
        <TabsContent value="logs" className="mt-0">
          {renderSystemLogs()}
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-0">
          {renderAdvancedSettings()}
        </TabsContent>
      </Tabs>

      <div className="mt-6 pt-6 border-t border-neutral-200 text-center text-neutral-500 text-sm">
        <p>Internal Portal System - Version 1.0.0</p>
        <p className="mt-1">© 2023 Your Company. All rights reserved.</p>
      </div>
    </>
  );
};

export default Config;
