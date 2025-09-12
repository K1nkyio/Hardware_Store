import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { communityPosts, communityCategories } from "@/data/communityPosts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, Calendar, Users, Lightbulb, HelpCircle, Award } from "lucide-react";

export default function Community() {
  const { t } = useLanguage();
  const [filteredPosts, setFilteredPosts] = useState(communityPosts);
  const [activeCategory, setActiveCategory] = useState("All Posts");
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (activeCategory === "All Posts") {
      setFilteredPosts(communityPosts);
    } else {
      setFilteredPosts(communityPosts.filter(post => post.category === activeCategory));
    }
  }, [activeCategory]);

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'showcase': return <Award className="w-5 h-5 text-yellow-500" />;
      case 'question': return <HelpCircle className="w-5 h-5 text-blue-500" />;
      case 'event': return <Calendar className="w-5 h-5 text-green-500" />;
      default: return <Lightbulb className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24">
        <section className="section-sm">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t.community.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t.community.subtitle}
              </p>
            </div>

            {/* Community Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center p-6">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-yellow-600" />
                  </div>
                  <CardTitle className="text-xl mb-2">{t.community.showcase.title}</CardTitle>
                  <CardDescription>{t.community.showcase.description}</CardDescription>
                  <Button className="mt-4" size="sm">
                    {t.community.showcase.shareProject}
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl mb-2">{t.community.forum.title}</CardTitle>
                  <CardDescription>{t.community.forum.description}</CardDescription>
                  <Button className="mt-4" size="sm" variant="outline">
                    Join Discussion
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center p-6">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl mb-2">{t.community.events.title}</CardTitle>
                  <CardDescription>{t.community.events.description}</CardDescription>
                  <Button className="mt-4" size="sm" variant="outline">
                    View Events
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Community Feed */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                {communityCategories.map(category => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeCategory} className="mt-8">
                <div className="space-y-6">
                  {filteredPosts.map(post => (
                    <Card key={post.id} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <img 
                            src={post.authorImage} 
                            alt={post.author}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getPostIcon(post.type)}
                              <CardTitle className="text-lg">{post.title}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{post.author}</span>
                              <span>•</span>
                              <span>{post.date}</span>
                            </div>
                          </div>
                          <Badge variant="outline">{post.category}</Badge>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <p className="text-muted-foreground mb-4">{post.content}</p>
                        
                        {post.image && (
                          <img 
                            src={post.image} 
                            alt={post.title}
                            className="w-full h-64 object-cover rounded-lg mb-4"
                          />
                        )}

                        <div className="flex flex-wrap gap-2">
                          {post.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>

                      <CardFooter className="border-t pt-4">
                        <div className="flex items-center gap-4 w-full">
                          <Button variant="ghost" size="sm" className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            {post.likes}
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments}
                          </Button>
                          <Button variant="ghost" size="sm" className="ml-auto">
                            Share
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                {filteredPosts.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg mb-4">
                      No posts in this category yet.
                    </p>
                    <Button>Be the first to share!</Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}