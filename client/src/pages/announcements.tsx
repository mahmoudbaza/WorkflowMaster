import { useQuery } from "@tanstack/react-query";
import { Announcement } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const Announcements = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements/all"],
  });

  const filteredAnnouncements = announcements
    ? announcements.filter((announcement) =>
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const renderAnnouncementsList = (items: Announcement[] | undefined, loading: boolean) => {
    if (loading) {
      return Array(3)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="animate-pulse flex flex-col md:flex-row bg-white rounded-lg overflow-hidden border border-neutral-200 mb-4"
          >
            <div className="md:w-1/4 lg:w-1/5 h-48 bg-neutral-200"></div>
            <div className="p-4 md:w-3/4 lg:w-4/5 space-y-3">
              <div className="h-6 bg-neutral-200 rounded"></div>
              <div className="h-4 bg-neutral-200 rounded"></div>
              <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              <div className="h-24 bg-neutral-200 rounded"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
            </div>
          </div>
        ));
    }

    if (!items || items.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-neutral-500">No announcements found.</p>
        </div>
      );
    }

    return items.map((announcement) => (
      <div
        key={announcement.id}
        className={`flex flex-col md:flex-row ${
          announcement.isNew ? "bg-neutral-50" : "bg-white"
        } rounded-lg overflow-hidden border border-neutral-200 mb-4`}
      >
        <div className="md:w-1/4 lg:w-1/5 min-h-[180px]">
          {announcement.imageUrl ? (
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-5M5 12h14"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="p-4 md:w-3/4 lg:w-4/5">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-xl text-neutral-800">
              {announcement.title}
            </h3>
            {announcement.isNew && (
              <span className="text-xs bg-[#0078d4] text-white px-2 py-1 rounded-full">
                New
              </span>
            )}
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-neutral-500">
              Posted by: {announcement.author}
            </span>
            <span className="mx-2 text-neutral-300">|</span>
            <span className="text-neutral-500">
              {new Date(announcement.date).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-neutral-600">{announcement.content}</p>
          </div>
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-neutral-700">Attachments:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {announcement.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    className="text-sm text-primary hover:text-primary-dark flex items-center"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {attachment.name}
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
              Read more
            </Button>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-700">Company Announcements</h2>
        <p className="text-neutral-500 mt-1">Stay updated with the latest company news and announcements</p>
      </div>

      <Card className="bg-white rounded-lg shadow-sm mb-6">
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700">Search Announcements</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Input
            placeholder="Search by title, content, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Announcements</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {renderAnnouncementsList(filteredAnnouncements, isLoading)}
        </TabsContent>
        
        <TabsContent value="unread" className="mt-0">
          {renderAnnouncementsList(
            filteredAnnouncements?.filter(a => !a.isRead),
            isLoading
          )}
        </TabsContent>
        
        <TabsContent value="read" className="mt-0">
          {renderAnnouncementsList(
            filteredAnnouncements?.filter(a => a.isRead),
            isLoading
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Announcements;
