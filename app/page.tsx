import { Nav } from "@/components/ui/Nav";
import { Preloader } from "@/components/sections/Preloader";
import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { FlexStory } from "@/components/sections/FlexStory";
import { Light } from "@/components/sections/Light";
import { Collection } from "@/components/sections/Collection";
import { Projects } from "@/components/sections/Projects";
import { WhyUs } from "@/components/sections/WhyUs";
import { SwissProof } from "@/components/sections/SwissProof";
import { Cta } from "@/components/sections/Cta";
import { Footer } from "@/components/sections/Footer";
import { SheetSeams } from "@/components/ui/SheetSeams";
import { PhoneDock } from "@/components/ui/PhoneDock";

export default function Home() {
  return (
    <>
      <Preloader />
      <Nav />
      <PhoneDock />
      <main>
        <Hero />
        <Manifesto />
        <FlexStory />
        <Light />
        <Collection />
        <Projects />
        <WhyUs />
        <SwissProof />
        <Cta />
      </main>
      {/* phones: cream chapters rise as arched sheets over the dark ones before them */}
      <SheetSeams />
      <Footer />
    </>
  );
}
