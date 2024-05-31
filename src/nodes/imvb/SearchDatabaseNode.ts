import type {
  ChartNode,
  EditorDefinition,
  Inputs,
  InternalProcessContext,
  NodeBodySpec,
  NodeConnection,
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  Outputs,
  PluginNodeImpl,
  PortId,
  Project,
  Rivet,
} from "@ironclad/rivet-core";

import type { AnyOrama } from "@orama/orama";
import { search } from "@orama/orama";

export type SearchDatabaseNode = ChartNode<
  "searchDatabase",
  {
    vdb?: AnyOrama;
    useVdbInput?: boolean;
    searchText: string;
    useSearchTextInput?: boolean;
  }
>;

export const searchDatabasePluginNode = (rivet: typeof Rivet) => {
  const impl: PluginNodeImpl<SearchDatabaseNode> = {
    create(): SearchDatabaseNode {
      const node: SearchDatabaseNode = {
        id: rivet.newId<NodeId>(),

        data: {
          vdb: undefined,
          searchText: "",
        },
        title: "Search Database Embedding",
        type: "searchDatabase",
        visualData: {
          x: 0,
          y: 0,
          width: 200,
        },
      };

      return node;
    },

    getInputDefinitions(
      data,
      _connections,
      _nodes,
      _project,
    ): NodeInputDefinition[] {
      const inputs: NodeInputDefinition[] = [];

      if (data.useVdbInput) {
        inputs.push({
          id: "vdb" as PortId,
          dataType: "any",
          title: "Database",
          required: true,
        });
      }

      if (data.useSearchTextInput) {
        inputs.push({
          id: "searchText" as PortId,
          dataType: "string",
          title: "Search Text",
          required: true,
        });
      }

      return inputs;
    },

    getOutputDefinitions(
      _data,
      _connections,
      _nodes,
      _project,
    ): NodeOutputDefinition[] {
      return [
        {
          id: "searchResults" as PortId,
          dataType: "string",
          title: "Search Results",
        },
      ];
    },

    getUIData(_context): NodeUIData {
      return {
        contextMenuTitle: "Search Database",
        group: "Orama",
        infoBoxBody:
          "This is a node for searching text in the in-memory vector database.",
        infoBoxTitle: "Search Database Node",
      };
    },

    getEditors(_data): EditorDefinition<SearchDatabaseNode>[] {
      return [
        {
          type: "string",
          dataKey: "searchText",
          label: "Search Text",
          useInputToggleDataKey: "useSearchTextInput",
        },
        {
          type: "anyData",
          dataKey: "vdb",
          label: "VDB",
          useInputToggleDataKey: "useVdbInput",
        },
      ];
    },

    getBody(
      data,
      _context,
    ): string | NodeBodySpec | NodeBodySpec[] | undefined {
      return rivet.dedent`
        Search Vector Node
        Search Text: ${data.searchText}
      `;
    },

    async process(data, inputData, _context): Promise<Outputs> {
      const vdb = rivet.getInputOrData(
        data,
        inputData,
        "vdb",
        "any",
        "useVdbInput",
      ) as AnyOrama;

      const text = rivet.getInputOrData(
        data,
        inputData,
        "searchText",
        "string",
        "useSearchTextInput",
      );

      const results = await search(vdb, {
        term: text,
      });

      return {
        ["searchResults" as PortId]: {
          type: "any",
          value: results,
        },
      };
    },
  };

  return rivet.pluginNodeDefinition(impl, "Search Database");
};
