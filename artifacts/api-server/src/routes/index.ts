import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import destinationsRouter from "./destinations.js";
import reservationsRouter from "./reservations.js";
import ticketsRouter from "./tickets.js";
import paymentsRouter from "./payments.js";
import adminRouter from "./admin.js";
import ratingsRouter from "./ratings.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/destinations", destinationsRouter);
router.use("/reservations", reservationsRouter);
router.use("/tickets", ticketsRouter);
router.use("/payments", paymentsRouter);
router.use("/admin", adminRouter);
router.use("/ratings", ratingsRouter);

export default router;
