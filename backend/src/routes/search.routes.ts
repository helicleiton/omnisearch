import { Router } from 'express';
import { searchController } from '../controllers/searchController';
import { requireApiKey } from '../middlewares/apiKey';
import { searchRateLimiter } from '../middlewares/rateLimiter';
import { validateSearch } from '../middlewares/validateSearch';

export const searchRouter = Router();

searchRouter.post('/search', searchRateLimiter, requireApiKey, validateSearch, searchController);
