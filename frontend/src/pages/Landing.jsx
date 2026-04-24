import Navbar from "../components/site/Navbar";
import Hero from "../components/site/Hero";
import PlatformFeatures from "../components/site/PlatformFeatures";
import ForShippers from "../components/site/ForShippers";
import ForCarriers from "../components/site/ForCarriers";
import Footer from "../components/site/Footer";

export default function Landing() {
  return (
    <div className="relative">
      <Navbar />
      <section id="hero">
        <Hero />
      </section>
      <section id="platform-features">
        <PlatformFeatures />
      </section>
      <section id="for-shippers">
        <ForShippers />
      </section>
      <section id="for-carriers">
        <ForCarriers />
      </section>
      <Footer />
    </div>
  );
}
