'use client';

import useGlobalContextProvider from '../ContextApi';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { userObject } = useGlobalContextProvider();
  const { user } = userObject;
  const { user: clerkUser, isLoaded } = useUser();
  const router = useRouter();

  function handleAuthAction() {
    if (clerkUser) {
      // User is logged in, redirect to sign out
      router.push('/sign-out');
    } else {
      // User is not logged in, redirect to sign in
      router.push('/sign-in');
    }
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <a className="block text-teal-600" href="/">
          <span className="sr-only">Home</span>
          <div className="flex items-center gap-2">
            <Image
              src="/biggies.png"
              alt=""
              height={50}
              width={50}
              className="rounded-md"
            />
            <h2 className="text-2xl font-bold flex gap-2">
            Beamer<span className="text-yellow-500">Brands</span>
            </h2>
          </div>
        </a>

        <div className="flex flex-1 items-center justify-end md:justify-between">
          <nav aria-label="Global" className="hidden md:block">
            <ul className="flex items-center gap-6 text-sm">
              <li>
                <a
                  className="text-gray-500 transition hover:text-gray-500/75"
                  href="#"
                >
                  About
                </a>
              </li>

              <li>
                <a
                  className="text-gray-500 transition hover:text-gray-500/75"
                  href="#"
                >
                  Careers
                </a>
              </li>

              <li>
                <a
                  className="text-gray-500 transition hover:text-gray-500/75"
                  href="#"
                >
                  History
                </a>
              </li>

              <li>
                <a
                  className="text-gray-500 transition hover:text-gray-500/75"
                  href="#"
                >
                  Services
                </a>
              </li>

              <li>
                <a
                  className="text-gray-500 transition hover:text-gray-500/75"
                  href="#"
                >
                  Projects
                </a>
              </li>

              <li>
                <a
                  className="text-gray-500 transition hover:text-gray-500/75"
                  href="#"
                >
                  Blog
                </a>
              </li>
            </ul>
          </nav>

          <div className="mt-4 flex flex-col gap-4 sm:mt-0 sm:flex-row sm:items-center">
            {isLoaded && clerkUser && (
              <div className="flex gap-2">
                <span>Welcome: {user.name}</span>
              </div>
            )}

            <button
              className="block rounded-lg bg-yellow-500 px-7 py-3 text-sm font-medium text-black transition hover:bg-yellow-600 focus:outline-none"
              type="button"
              onClick={handleAuthAction}
            >
              {isLoaded && clerkUser ? 'Logout' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
