"use client";
import Image from "next/image";
import Editor from "@/components/RichTextEditor";
import { MoveLeftIcon } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col gap-2 text-sm font-normal w-full">
        <Editor
          onChange={(html) => {
            console.log("html");
          }}
          // value={}
        />
      </div>
    </main>
  );
}
