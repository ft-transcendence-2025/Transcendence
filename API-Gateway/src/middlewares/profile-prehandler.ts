import { FastifyReply, FastifyRequest } from "fastify";
import { profileRules } from "../rules/profile.rules";

export const profilePreHandler = (app: any) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const { method, params } = req;
    const username = (params as { username?: string })?.username;
    const hasUsername = Boolean(username);

    const rule = profileRules.find((r: any) => r.match(method, hasUsername));

    // If no rule found → assume public route, no auth required
    if (!rule) return;

    if (rule.needsAuth) {
      await app.authenticate(req, reply);
    }

    if (rule.policyFn) {
      await app.authorize(rule.policyFn)(req, reply);
    }
  };
};
