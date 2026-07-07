import Link from "next/link"
import { Bus, Mail, Phone, MapPin, Smartphone, Store, Calendar } from "lucide-react"
import { todayNepali } from "@/lib/nepali-date"

const footerLinks = {
  company: [
    { label: "About Us", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Partners", href: "#" },
    { label: "Careers", href: "#" },
  ],
  support: [
    { label: "Help Center", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Sitemap", href: "#" },
  ],
  quickRoutes: [
    { label: "Kathmandu → Pokhara", href: "/booking/search?from=Kathmandu&to=Pokhara" },
    { label: "Kathmandu → Kakarbhitta", href: "/booking/search?from=Kathmandu&to=Kakarbhitta" },
    { label: "Kathmandu → Biratnagar", href: "/booking/search?from=Kathmandu&to=Biratnagar" },
    { label: "Kathmandu → Lumbini", href: "/booking/search?from=Kathmandu&to=Lumbini" },
    { label: "Kathmandu → Chitwan", href: "/booking/search?from=Kathmandu&to=Chitwan" },
    { label: "Pokhara → Kathmandu", href: "/booking/search?from=Pokhara&to=Kathmandu" },
  ],
  cities: [
    "Kathmandu", "Pokhara", "Biratnagar", "Lalitpur", "Bhaktapur",
    "Chitwan", "Butwal", "Bhairahawa", "Hetauda", "Janakpur",
    "Dharan", "Itahari", "Bhadrapur", "Kakarbhitta", "Lumbini",
    "Nepalgunj", "Dhangadhi", "Tikapur", "Ghorahi",
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-600">
                <Bus className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-zinc-900">
                Sa<span className="text-violet-600">bari</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Nepal&apos;s most reliable vehicle booking platform — connecting travellers across the country.
            </p>
            <div className="flex gap-3 pt-2">
              <Link href="#" className="inline-flex items-center gap-2 rounded-lg bg-zinc-200 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-300 transition-colors">
                <Store className="h-4 w-4" />
                App Store
              </Link>
              <Link href="#" className="inline-flex items-center gap-2 rounded-lg bg-zinc-200 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-300 transition-colors">
                <Smartphone className="h-4 w-4" />
                Google Play
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-900 mb-4">Company</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-zinc-500 hover:text-violet-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-900 mb-4">Quick Routes</h3>
            <ul className="space-y-2.5">
              {footerLinks.quickRoutes.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-zinc-500 hover:text-violet-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-900 mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-zinc-500">
                <MapPin className="h-4 w-4 mt-0.5 text-violet-600 shrink-0" />
                New Baneshwor, Kathmandu, Nepal
              </li>
              <li className="flex items-center gap-2.5 text-sm text-zinc-500">
                <Phone className="h-4 w-4 text-violet-600 shrink-0" />
                9704-666-777
              </li>
              <li className="flex items-center gap-2.5 text-sm text-zinc-500">
                <Mail className="h-4 w-4 text-violet-600 shrink-0" />
                support@sabari.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Calendar className="h-3 w-3 text-violet-600" />
              <span>{todayNepali()}</span>
            </div>
            <p className="text-xs text-zinc-500">
              &copy; {new Date().getFullYear()} Sabari Bookings Pvt. Ltd. All rights reserved.
            </p>
            <div className="flex gap-4 text-xs text-zinc-500">
              <Link href="#" className="hover:text-zinc-700 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-zinc-700 transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-zinc-700 transition-colors">Sitemap</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
