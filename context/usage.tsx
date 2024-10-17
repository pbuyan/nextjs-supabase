"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { usageCount } from "@/app/actions/queries";
import { checkUserSusbcription } from "@/app/actions/stripe";
import { User } from "@/utils/types";
import { createClient } from "@/utils/supabase/client";
// import { useUser } from "@clerk/nextjs";

interface UsageContextType {
  count: number;
  fetchUsage: () => void;
  openModal: boolean;
  setOpenModal: (open: boolean) => void;
  subscribed: boolean;
}

const UsageContext = createContext<UsageContextType | null>(null);

export const UsageProvider = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => {
  // state
  const [count, setCount] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  // hooks
  const supabase = createClient();

  const [user, setUser] = useState<User | null>();
  const [userEmail, setUserEmail] = useState<string>("");
  // const email = user?.primaryEmailAddress?.emailAddress || "";

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .match({ email: user?.email });

      if (userData) {
        setUser(userData[0]);
        setUserEmail(userData[0].email);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchUsage();
      fetchSubscription();
    }
  }, [userEmail]);

  useEffect(() => {
    if (
      !subscribed &&
      count > Number(process.env.NEXT_PUBLIC_FREE_TIER_USAGE)
    ) {
      setOpenModal(true);
    } else {
      setOpenModal(false);
    }
  }, [count, subscribed]);

  const fetchUsage = async () => {
    const res = await usageCount(userEmail);
    setCount(res);
  };

  const fetchSubscription = async () => {
    const response = await checkUserSusbcription();
    setSubscribed(response?.ok || false);
  };

  return (
    <UsageContext.Provider
      value={{ count, fetchUsage, openModal, setOpenModal, subscribed }}
    >
      {children}
    </UsageContext.Provider>
  );
};

export const useUsage = () => {
  const context = useContext(UsageContext);
  if (context === null) {
    throw new Error("useUsage must be used within a UsageProvider");
  }
  return context;
};
