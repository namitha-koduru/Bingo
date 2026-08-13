import React from "react";
import { motion } from "framer-motion";

export default function DisconnectBanner({ name }) {
  return (
    <motion.div
      className="disconnect-banner"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
    >
      ⚠️ {name} disconnected. Waiting for {name} to reconnect…
    </motion.div>
  );
}
