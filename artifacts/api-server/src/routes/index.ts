import { Router, type IRouter } from "express";
import healthRouter from "./health";
import schoolsRouter from "./schools";
import usersRouter from "./users";
import postsRouter from "./posts";
import adminRouter from "./admin";
import callsRouter from "./calls";
import newsRouter from "./news";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(schoolsRouter);
router.use(usersRouter);
router.use(postsRouter);
router.use(callsRouter);
router.use(newsRouter);

export default router;
