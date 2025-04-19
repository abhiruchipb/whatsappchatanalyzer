import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Image from 'next/image';
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Bloop",
  description: "Over-analyze your Whatsapp chats",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        {children}
        <footer className="h-50 bg-blue-950/90 text-amber-50 flex flex-row items-center justify-center px-60">
          <div className="flex items-center w-full flex-row justify-between">
            <div className="flex flex-row items-end">
              <Image
                src="/bloop_white.svg"
                alt="Bloop Logo"
                width={300}
                height={100}
                style={{ height: "auto" }} // Maintain aspect ratio
                draggable="false"
              />
              <p className="mb-3 ml-3">
                Fully open source - visit the{" "}
                <a
                  className="underline"
                  href="https://github.com/funinkina/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github repo
                </a>{" "}
                and ⭐ it
              </p>
            </div>
          </div>
          <div className="text-right">
            <Image
              src="Created_by.svg"
              alt="bloop logo footer"
              width={200}
              height={200}
              className="mb-4 h-auto"
            />
            <p className="underline"><a href="https://funinkina.is-a.dev" target="_blank" rel="noopener noreferrer">Aryan Kushwaha</a></p>
            <p className="underline"><a href="https://www.linkedin.com/in/abhiruchi-patil-bhagat-22b025235/" target="_blank" rel="noopener noreferrer">Abhiruchi Patil Bhagat</a></p>
          </div>
        </footer>
      </body>
    </html>
  );
}