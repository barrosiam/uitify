import { toast } from "sonner";
import type { ReactNode } from "react";

export const notify = {
  success: (title: ReactNode, opts?: { description?: ReactNode }) =>
    toast.success(title, opts),
  error: (title: ReactNode, opts?: { description?: ReactNode }) =>
    toast.error(title, opts),
  info: (title: ReactNode, opts?: { description?: ReactNode }) =>
    toast.info(title, opts),

  promise<T>(
    p: Promise<T>,
    msgs: {
      loading: ReactNode;
      success: (value: T) => ReactNode;
      error: (err: unknown) => ReactNode;
    },
  ): Promise<T> {
    toast.promise(p, {
      loading: msgs.loading,
      success: (v) => msgs.success(v),
      error: (e) => msgs.error(e),
    });
    return p;
  },
};
