import { useQuery } from "@tanstack/react-query";
import { Document } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DocumentsSection = () => {
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents/to-sign"],
  });

  const getDocumentStatusIcon = (daysLeft: number) => {
    if (daysLeft <= 2) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#a80000] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (daysLeft <= 5) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#d83b01] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardHeader className="px-4 py-3 border-b border-neutral-200">
        <CardTitle className="font-semibold text-neutral-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Documents To Sign
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        <div className="rounded-lg overflow-hidden border border-neutral-200 mb-4">
          <svg
            viewBox="0 0 400 200"
            className="w-full h-32"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="100%" height="100%" fill="#f8f9fa" />
            <g transform="translate(200 100)">
              <g>
                <rect
                  x="-60"
                  y="-30"
                  width="120"
                  height="60"
                  rx="5"
                  ry="5"
                  fill="#ffffff"
                  stroke="#0078d4"
                  strokeWidth="2"
                />
                <line
                  x1="-40"
                  y1="-10"
                  x2="40"
                  y2="-10"
                  stroke="#0078d4"
                  strokeWidth="2"
                />
                <line
                  x1="-40"
                  y1="0"
                  x2="40"
                  y2="0"
                  stroke="#0078d4"
                  strokeWidth="2"
                />
                <line
                  x1="-40"
                  y1="10"
                  x2="20"
                  y2="10"
                  stroke="#0078d4"
                  strokeWidth="2"
                />
                <path
                  d="M-80,40 C-70,20 -30,30 -20,15 C-10,0 20,0 30,15 C40,30 80,10 90,30"
                  fill="none"
                  stroke="#0078d4"
                  strokeWidth="3"
                />
                <circle cx="90" cy="30" r="5" fill="#0078d4" />
              </g>
            </g>
          </svg>
        </div>

        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg border border-neutral-200 animate-pulse">
                <div className="flex items-center">
                  <div className="h-5 w-5 bg-neutral-200 rounded-full mr-3"></div>
                  <div>
                    <div className="h-4 bg-neutral-200 rounded w-48 mb-1"></div>
                    <div className="h-3 bg-neutral-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-6 bg-neutral-200 rounded w-20"></div>
              </div>
            ))
        ) : !documents || documents.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-neutral-500">No documents to sign at the moment.</p>
          </div>
        ) : (
          documents.map((document) => (
            <div key={document.id} className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center">
                {getDocumentStatusIcon(document.daysLeft)}
                <div>
                  <h4 className="font-medium text-sm text-neutral-800">{document.title}</h4>
                  <p className="text-xs text-neutral-500">Due in {document.daysLeft} days</p>
                </div>
              </div>
              <Button
                className="px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary-dark"
                size="sm"
              >
                Sign Now
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentsSection;
