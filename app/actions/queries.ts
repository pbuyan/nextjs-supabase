"use server";

import { Query } from "@/utils/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addQuery(newQuery: Query) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not logged in");
  }

  const { error } = await supabase.from("queries").insert(newQuery);

  if (error) {
    throw new Error("Error adding task");
  }

  revalidatePath("/history");
}

export async function getQueries(
  email: string,
  page: number,
  pageSize: number
) {
  const supabase = createClient();
  try {
    const skip = (page - 1) * pageSize;

    const {
      error,
      data: queries,
      count: totalQueries,
    } = await supabase
      .from("queries")
      .select("*", { count: "exact" })
      .range(skip, skip + pageSize - 1);

    const totalQ = totalQueries || 0;

    return {
      queries,
      totalPages: Math.ceil(totalQ / pageSize),
    };
  } catch (err) {
    return {
      ok: false,
    };
  }
}
export async function usageCount(email: string) {
    // await db();

    const supabase = createClient();
  
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const usageCount = await supabase.from('queries').select('content', { count: 'exact', head: true });
  
    // const result = await Query.aggregate([
    //   {
    //     $match: {
    //       email: email,
    //       $expr: {
    //         $and: [
    //           { $eq: [{ $year: "$createdAt" }, currentYear] },
    //           { $eq: [{ $month: "$createdAt" }, currentMonth] },
    //         ],
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       wordCount: {
    //         $size: {
    //           $split: [{ $trim: { input: "$content" } }, " "],
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       totalWords: { $sum: "$wordCount" },
    //     },
    //   },
    // ]);
  
    return 0;
    // return result.length > 0 ? result[0].totalWords : 0;
  }