"use client";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2Icon, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import template from "@/utils/template";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { runAi } from "@/app/actions/ai";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { createClient } from "@/utils/supabase/client";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";

import { Toaster, toast } from "react-hot-toast";
import { Query, Template, User } from "@/utils/types";
import { addQuery } from "@/app/actions/queries";

// import { useUsage } from "@/context/usage";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function Page({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>();

  const [value, setValue] = useState<string | undefined>("");
  // state
  const [query, setQuery] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  // ref
  const previewRef = useRef<any>(null);
  // hooks
  // const { fetchUsage, subscribed, count } = useUsage(); // context
  // const { user } = useUser();
  // console.log("useUser() in slug page", user);
  // const email = user?.primaryEmailAddress?.emailAddress || "";

  useEffect(() => {
    if (content) {
      setContent(content);
    }
  }, [content]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .match({ email: user?.email });

      userData && setUser(userData[0]);
    };

    fetchUser();
  }, []);

  const t = template.find((item) => item.slug === params.slug) as Template;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await runAi(t.aiPrompt + query);
      setContent(data);

      const newQuery: Query = {
        template: t as unknown as JSON,
        query,
        content: data,
        email: user?.email ?? null,
      };

      await addQuery(newQuery);

      // save to db
      // await saveQuery(t, email, query, data);
      // fetchUsage();
    } catch (err) {
      setContent("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      const plainText = previewRef.current.innerText;
      await navigator.clipboard.writeText(plainText);
      toast.success("Content copied to clipboard.");
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <div>
      <div className="flex justify-between mx-5 my-3">
        <Link href="/dashboard">
          <Button>
            <ArrowLeft /> <span className="ml-2">Back</span>
          </Button>
        </Link>

        <Button onClick={handleCopy}>
          <Copy /> <span className="ml-2">Copy</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-5">
        <div className="col-span-1 bg-slate-100 dark:bg-slate-900 rounded-md border p-5">
          <div className="flex flex-col gap-3">
            <Image src={t.icon} alt={t.name} width={50} height={50} />
            <h2 className="font-medium text-lg">{t.name}</h2>
            <p className="text-gray-500">{t.desc}</p>
          </div>

          <form className="mt-6" onSubmit={handleSubmit}>
            {t.form.map((item) => (
              <div className="my-2 flex flex-col gap-2 mb-7" key={item.name}>
                <label className="font-bold pb-5">{item.label}</label>

                {item.field === "input" ? (
                  <Input
                    name={item.name}
                    onChange={(e) => setQuery(e.target.value)}
                    required={item.required}
                  />
                ) : (
                  <Textarea
                    name={item.name}
                    onChange={(e) => setQuery(e.target.value)}
                    required={item.required}
                  />
                )}
              </div>
            ))}

            <Button type="submit" className="w-full py-6" disabled={loading}>
              {loading && <Loader2Icon className="animate-spin mr-2" />}
              Generate content
            </Button>
            {/* <Button
              type="submit"
              className="w-full py-6"
              disabled={
                loading ||
                (!subscribed &&
                  count >= Number(process.env.NEXT_PUBLIC_FREE_TIER_USAGE))
              }
            >
              {loading && <Loader2Icon className="animate-spin mr-2" />}
              {subscribed ||
              count < Number(process.env.NEXT_PUBLIC_FREE_TIER_USAGE)
                ? "Generate content"
                : "Subscribe to generate content"}
            </Button> */}
          </form>
        </div>

        <div className="col-span-2">
          <MDEditor value={content} preview={"preview"} height={400} />
          <div ref={previewRef} className="hidden">
            <MarkdownPreview source={content} />
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
