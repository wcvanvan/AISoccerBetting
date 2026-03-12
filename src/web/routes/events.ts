/**
 * Events route — lists upcoming soccer matches from The Odds API.
 */

import { FastifyInstance } from 'fastify';
import { getUpcomingFixtures, SUPPORTED_LEAGUES } from '../services/event-service';

export async function eventsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/events', async (request, reply) => {
    const query = request.query as { league?: string | string[] };
    let leagueKeys: string[] | undefined;

    if (query.league) {
      leagueKeys = Array.isArray(query.league)
        ? query.league
        : [query.league];
    }

    try {
      const fixtures = await getUpcomingFixtures(leagueKeys);
      return { events: fixtures, leagues: SUPPORTED_LEAGUES };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      reply.status(500);
      return { error: msg, events: [], leagues: SUPPORTED_LEAGUES };
    }
  });
}
