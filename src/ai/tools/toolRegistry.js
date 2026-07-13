/* Tool registry — Claude tool-calling schemas + the executor.

   Live tools do real work (calculator, weather). Declared-but-unconnected tools
   (market, schemes, pdf, imageAnalyzer) honestly report that their source is not
   integrated yet, so agents answer from general knowledge and say so — no fake
   data, per project rules. Connecting them in a later phase is a one-file change. */

import { calculatorTool } from "./calculator.js";
import { weatherTool } from "./weatherTool.js";

const notConnected = (name, hint) => ({
  name,
  description:
    `${hint} NOTE: this data source is not connected yet — if you call it, you will be told it is unavailable; ` +
    "prefer answering from general knowledge and telling the farmer how to check the live source themselves.",
  input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  async run() {
    return JSON.stringify({ unavailable: true, message: "This data source is not integrated yet. Answer from general knowledge and clearly tell the farmer this is not live data." });
  },
});

const TOOLS = new Map(
  [
    calculatorTool,
    weatherTool, // live as of Phase 4A
    notConnected("market", "Get live mandi prices for a crop."),
    notConnected("schemes", "Look up current government scheme details."),
    notConnected("pdf", "Generate a PDF document from content."),
    notConnected("imageAnalyzer", "Run specialised image analysis (disease models, OCR)."),
  ].map((t) => [t.name, t]),
);

export const toolRegistry = {
  /* Wire schemas for the agent's whitelisted tools. */
  schemasFor(agent) {
    return (agent.tools || [])
      .map((name) => TOOLS.get(name))
      .filter(Boolean)
      .map(({ name, description, input_schema }) => ({ name, description, input_schema }));
  },

  /* Execute one tool_use block → tool_result block. Errors return is_error. */
  async execute(block) {
    const tool = TOOLS.get(block.name);
    try {
      if (!tool) throw new Error(`unknown tool: ${block.name}`);
      const result = await tool.run(block.input || {});
      return { type: "tool_result", tool_use_id: block.id, content: String(result) };
    } catch (e) {
      return { type: "tool_result", tool_use_id: block.id, content: `Error: ${e.message}`, is_error: true };
    }
  },
};
