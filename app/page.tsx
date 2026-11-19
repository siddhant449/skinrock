import { Nav } from "@/components/ui/Nav";
import { Preloader } from "@/components/sections/Preloader";
import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { FlexStory } from "@/components/sections/FlexStory";
import { Light } from "@/components/sections/Light";

export default function Home() {
  return (
    <>
      <Preloader />
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <FlexStory />
        <Light />
      </main>
    </>
  );
}
