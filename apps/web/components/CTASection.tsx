import Link from "next/link";
import { BlankBoardSketch } from "./BoardSketch";

export default function CTASection() {
    return (
        <section className="border-t border-[#ece8df] bg-[#f9f6ef] px-4 py-20 sm:px-6 sm:py-24">
            <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="max-w-xl text-3xl font-bold tracking-tight text-[#1a1916] sm:text-4xl md:text-5xl">
                        Open a blank board.
                        <br />
                        Send the slug.
                    </h2>
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#5c5850]">
                        No workspace tree. The people who have the link are the room.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Link
                            href="/signup"
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#e04e1f] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#c94318]"
                        >
                            Start a board
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-[#5c5850] transition-colors hover:text-[#1a1916]"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
                <div className="hidden shrink-0 lg:block">
                    <BlankBoardSketch />
                </div>
            </div>
        </section>
    );
}
