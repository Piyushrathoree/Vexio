import React from 'react'
import { kalam, ranchers } from '../../app/fonts';

const Navbar = () => {
  return (
      <div>
          <nav
              className={`h-[70px] relative w-full px-6 md:px-16 lg:px-24 xl:px-32 flex items-center justify-between z-20  text-gray-700 transition-all ${kalam.className}`}
          >
              <a
                  href="#"
                  className={`text-indigo-600 text-2xl text-bold ${ranchers.className}`}
              >
                  VEXIO
              </a>

              <ul className="md:flex hidden items-center gap-10 ml-30">
                  <li>
                      <a
                          className="hover:underline inset-1.5  transition"
                          href="#"
                      >
                          Features
                      </a>
                  </li>
                  <li>
                      <a
                          className="hover:underline inset-1.5  transition"
                          href="#"
                      >
                          Collabration
                      </a>
                  </li>
                  <li>
                      <a
                          className="hover:underline inset-1.5  transition"
                          href="#"
                      >
                          AI Icons
                      </a>
                  </li>
                  <li>
                      <a
                          className="hover:underline inset-1.5 transition"
                          href="#"
                      >
                          Why Vexio
                      </a>
                  </li>
              </ul>

              <div className="flex gap-1 items-center ">
                  <button
                      type="button"
                      className="bg-white text-gray-600 md:inline hidden text-sm hover:bg-gray-50 active:scale-95 transition-all w-25 h-9 rounded-lg"
                  >
                      Sign In
                  </button>
                  <button
                      type="button"
                      className="bg-white text-gray-600 border border-gray-300 md:inline hidden text-sm hover:bg-gray-50 active:scale-95 transition-all w-25 h-9 rounded-lg"
                  >
                      Start Free
                  </button>
              </div>
              <button
                  aria-label="menu-btn"
                  type="button"
                  className="menu-btn inline-block md:hidden active:scale-90 transition"
              >
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="30"
                      height="30"
                      viewBox="0 0 30 30"
                      fill="#000"
                  >
                      <path d="M 3 7 A 1.0001 1.0001 0 1 0 3 9 L 27 9 A 1.0001 1.0001 0 1 0 27 7 L 3 7 z M 3 14 A 1.0001 1.0001 0 1 0 3 16 L 27 16 A 1.0001 1.0001 0 1 0 27 14 L 3 14 z M 3 21 A 1.0001 1.0001 0 1 0 3 23 L 27 23 A 1.0001 1.0001 0 1 0 27 21 L 3 21 z"></path>
                  </svg>
              </button>

              <div className="mobile-menu absolute top-[70px] left-0 w-full bg-white/90 backdrop-blur-md p-6 hidden md:hidden">
                  <ul className="flex flex-col space-y-4 text-lg">
                      <li>
                          <a href="#" className="text-sm">
                              Home
                          </a>
                      </li>
                      <li>
                          <a href="#" className="text-sm">
                              Services
                          </a>
                      </li>
                      <li>
                          <a href="#" className="text-sm">
                              Portfolio
                          </a>
                      </li>
                      <li>
                          <a href="#" className="text-sm">
                              Pricing
                          </a>
                      </li>
                  </ul>

                  <button
                      type="button"
                      className="bg-white text-gray-600 border border-gray-300 mt-6 text-sm hover:bg-gray-50 active:scale-95 transition-all w-40 h-11 rounded-full"
                  >
                      Get started
                  </button>
              </div>
          </nav>
      </div>
  );
}

export default Navbar;