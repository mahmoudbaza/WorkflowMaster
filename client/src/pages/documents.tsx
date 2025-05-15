import { useQuery } from "@tanstack/react-query";
import { Document } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useState } from "react";

const Documents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const filteredDocuments = documents
    ? documents.filter((document) =>
        document.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        document.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case "word":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case "excel":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case "image":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const renderDocumentGrid = (items: Document[] | undefined, loading: boolean) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-neutral-200 p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-neutral-200 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-3 h-16 bg-neutral-200 rounded"></div>
                <div className="mt-3 flex justify-between">
                  <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                  <div className="h-8 bg-neutral-200 rounded w-24"></div>
                </div>
              </div>
            ))}
        </div>
      );
    }

    if (!items || items.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-neutral-500">No documents found.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((document) => (
          <div key={document.id} className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              {getDocumentIcon(document.type)}
              <div>
                <h3 className="font-medium text-neutral-800">{document.title}</h3>
                <p className="text-xs text-neutral-500">{document.type.toUpperCase()} • {formatDate(document.date)}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-neutral-600 line-clamp-2">{document.description}</p>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-neutral-500">
                {document.size} • {document.category}
              </span>
              <Button size="sm" className="text-xs">
                {document.status === "Requires Signature" ? "Sign Now" : "View"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-700">My Documents</h2>
        <p className="text-neutral-500 mt-1">Access and manage your documents</p>
      </div>

      <Card className="bg-white rounded-lg shadow-sm mb-6">
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700">Search Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search by title or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <Button>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="signed">Signed</TabsTrigger>
          <TabsTrigger value="pending">Pending Signature</TabsTrigger>
          <TabsTrigger value="uploaded">Uploaded</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {renderDocumentGrid(filteredDocuments, isLoading)}
        </TabsContent>
        
        <TabsContent value="signed" className="mt-0">
          {renderDocumentGrid(
            filteredDocuments?.filter(d => d.status === "Signed"),
            isLoading
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="mt-0">
          {renderDocumentGrid(
            filteredDocuments?.filter(d => d.status === "Requires Signature"),
            isLoading
          )}
        </TabsContent>
        
        <TabsContent value="uploaded" className="mt-0">
          {renderDocumentGrid(
            filteredDocuments?.filter(d => d.status === "Uploaded"),
            isLoading
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Documents;
