import { site } from "@/content/site";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { ScrollFill } from "@/components/ui/ScrollFill";

// Temporary composition; sections replace this in Tasks 5 to 9.
export default function Home() {
  return (
    <main>
      <section className="flex min-h-svh items-end p-8">
        <SplitReveal as="h1" trigger="load" className="text-display max-w-[14ch] text-[8vw]">
          {site.hero.headline}
        </SplitReveal>
      </section>
      <section id="light" className="min-h-svh bg-deep p-8">
        <ScrollFill text={site.light.paragraph} className="text-headline max-w-3xl text-5xl" />
      </section>
    </main>
  );
}
