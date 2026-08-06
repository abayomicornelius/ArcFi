import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
