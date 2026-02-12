import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const posts = [
  {
    slug: 'how-to-spot-fake-reviews',
    title: 'How to Spot Fake Reviews',
    excerpt: 'Practical checks to identify misleading reviews before you trust a listing.',
    date: 'February 2026',
  },
  {
    slug: 'before-you-claim-business-profile',
    title: 'Before You Claim a Business Profile',
    excerpt: 'What business owners should prepare to verify profile ownership quickly.',
    date: 'February 2026',
  },
  {
    slug: 'write-a-helpful-review',
    title: 'How to Write a Helpful Review',
    excerpt: 'Simple structure for clear, balanced reviews that help other customers.',
    date: 'February 2026',
  },
];

export default function BlogPage() {
  return (
    <div className="container max-w-5xl py-8 md:py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold sm:text-4xl">Blog</h1>
        <p className="text-muted-foreground">
          Insights on trusted reviews, verification, and safer decisions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <Card key={post.slug} className="h-full">
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
              <CardDescription>{post.date}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{post.excerpt}</p>
              <Link href="#" className="text-sm font-semibold text-primary hover:underline">
                Read article
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
