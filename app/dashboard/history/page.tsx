"use client";

import React, { useState, useEffect } from "react";
import { getQueries } from "@/app/actions/queries";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import QueryTable from "@/components/table/query-table";
import { createClient } from "@/utils/supabase/client";
import { User } from "@/utils/types";

export default function Page() {
  const [queries, setQueries] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(2);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const [user, setUser] = useState<User | null>();

  interface QueryResponse {
    queries: [];
    totalPages: number;
  }

  // hooks
  // const { user } = useUser();
  // const email = user?.primaryEmailAddress?.emailAddress || "";

  useEffect(() => {
    if (page === 1 && user?.email) fetchQueries(user.email);
  }, [page, user?.email]);

  useEffect(() => {
    if (page > 1 && user?.email) loadMore(user.email);
  }, [page]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .match({ email: user?.email });

      console.log("User:", userData);
      userData && setUser(userData[0]);
    };

    fetchUser();
  }, []);

  const fetchQueries = async (email: string) => {
    setLoading(true);
    try {
      const res = (await getQueries(email, page, perPage)) as QueryResponse;
      console.log("res: ", res);
      setQueries(res.queries);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async (email: string) => {
    setLoading(true);
    try {
      const res = (await getQueries(email, page, perPage)) as QueryResponse;
      setQueries([...queries, ...res.queries]);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="p-10 my-5 mx-5 mb-5 rounded-lg bg-slate-200 dark:bg-slate-800 flex flex-col justify-center items-center">
        <h1 className="text-xl">History</h1>
        <p className="text-sm text-gray-500">Your previous search history</p>
      </div>

      <div className="p-5 rounded-lg flex flex-col justify-center">
        {queries.length > 0 && <QueryTable data={queries} />}
        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <Loader2Icon className="animate-spin mx-2" />
          </div>
        ) : null}
      </div>

      <div className="text-center my-5">
        {page < totalPages && (
          <Button onClick={() => setPage(page + 1)} disabled={loading}>
            {loading ? (
              <Loader2Icon className="animate-spin mx-2" />
            ) : (
              "Load More"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
