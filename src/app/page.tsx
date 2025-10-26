import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Leaf,
  UtensilsCrossed,
  Truck,
  Sprout,
  ShoppingBasket,
  Carrot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AppLogo } from '@/components/logo';

const featureData = [
  {
    icon: <Leaf className="size-8 text-primary" />,
    title: 'For Farmers',
    description:
      'Sell your produce directly to restaurants. Set your own prices, upload crop images, and manage orders with your voice.',
    link: '/signup?role=farmer',
  },
  {
    icon: <UtensilsCrossed className="size-8 text-primary" />,
    title: 'For Restaurants',
    description:
      'Source the freshest ingredients directly from local farms. Discover farmers within your vicinity and ensure quality.',
    link: '/signup?role=restaurant',
  },
  {
    icon: <Truck className="size-8 text-primary" />,
    title: 'For Transporters',
    description:
      'Earn by delivering fresh produce. Verify crop quality and get paid based on distance and weight.',
    link: '/signup?role=transporter',
  },
];

const howItWorksData = [
  {
    icon: <Carrot className="size-10 text-primary" />,
    title: '1. Farmer Lists Produce',
    description:
      'Farmers use voice or text to list their crops, set prices, and upload images.',
    image: PlaceHolderImages.find((img) => img.id === 'how-it-works-1'),
  },
  {
    icon: <ShoppingBasket className="size-10 text-primary" />,
    title: '2. Restaurant Places Order',
    description:
      'Restaurants browse nearby farms and place orders for fresh, local ingredients.',
    image: PlaceHolderImages.find((img) => img.id === 'how-it-works-2'),
  },
  {
    icon: <Truck className="size-10 text-primary" />,
    title: '3. Transporter Delivers',
    description:
      'A transporter picks up the produce, verifies its quality, and delivers it to the restaurant.',
    image: PlaceHolderImages.find((img) => img.id === 'how-it-works-3'),
  },
];

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-1');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <AppLogo className="size-6" />
            <span className="font-bold font-headline">Hyperlocal Supply Chain Connector</span>
          </Link>
          <nav className="flex flex-1 items-center space-x-6 text-sm font-medium"></nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative h-[60vh] min-h-[400px] w-full">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="relative z-10 flex h-full items-center justify-center text-center">
            <div className="container max-w-4xl">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                From Farm to Fork, The Direct Way.
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Connecting local farmers with restaurants and transporters for
                fresher produce and sustainable partnerships.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Get Started <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 sm:py-24">
          <div className="container">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl">
                A Platform for Everyone
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                We empower every link in the food supply chain, from the field to
                the kitchen.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {featureData.map((feature) => (
                <Card key={feature.title} className="flex flex-col">
                  <CardHeader className="items-center">
                    <div className="rounded-full bg-secondary p-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline mt-4">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow text-center">
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={feature.link}>
                        Learn More <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-secondary py-16 sm:py-24">
          <div className="container">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                A simple, streamlined process for fresh food delivery.
              </p>
            </div>
            <div className="mt-12 space-y-12">
              {howItWorksData.map((step, index) => (
                <div
                  key={step.title}
                  className={`grid items-center gap-8 md:grid-cols-2 md:gap-16`}
                >
                  <div className={`md:order-${index % 2 === 1 ? '2' : '1'}`}>
                    {step.image && (
                      <Image
                        src={step.image.imageUrl}
                        alt={step.image.description}
                        width={600}
                        height={400}
                        className="rounded-lg shadow-lg"
                        data-ai-hint={step.image.imageHint}
                      />
                    )}
                  </div>
                  <div className={`md:order-${index % 2 === 1 ? '1' : '2'}`}>
                    <div className="flex items-center gap-4">
                      {step.icon}
                      <h3 className="font-headline text-2xl font-bold">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-4 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="py-16 sm:py-24">
          <div className="container text-center">
            <h2 className="font-headline text-3xl font-bold sm:text-4xl">
              Ready to Join?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              Become a part of the future of fresh food supply. Register today
              and grow your business with us.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Sign Up Now <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <AppLogo />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © {new Date().getFullYear()} Hyperlocal Supply Chain Connector. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
