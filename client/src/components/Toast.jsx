import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import "../styles/toast.css";

export default function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="toast"
          role="alert"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.2 }}
        >
          ✏️ {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
