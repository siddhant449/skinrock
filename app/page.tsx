import { site } from "@/content/site";
import { Nav } from "@/components/ui/Nav";
import { Preloader } from "@/components/sections/Preloader";
import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { FlexStory } from "@/components/sections/FlexStory";
import { ScrollFill } from "@/components/ui/ScrollFill";

export default function Home() {
  return (
    <>
      <Preloader />
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <FlexStory />
        {/* temporary until Task 7 */}
        <section id="light" className="min-h-svh bg-deep p-8">
          <ScrollFill text={site.light.paragraph} className="text-headline relative z-20 max-w-3xl text-5xl" />
        </section>
      </main>
    </>
  );
}
