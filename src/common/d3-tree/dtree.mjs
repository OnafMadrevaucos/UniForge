import TreeBuilder from "./builder.mjs";
import * as _ from "../../../node_modules/lodash-es/lodash.js";

const dTree = {

  VERSION: '/* @echo DTREE_VERSION */',

  init: function (root, data, options = {}) {
    var opts = _.defaultsDeep(options || {}, {
      target: '#graph',
      debug: false,
      width: 600,
      height: 600,
      hideMarriageNodes: true,
      callbacks: {
        nodeClick: function (name, extra, id) { },
        nodeRightClick: function (name, extra, id) { },
        marriageClick: function (extra, id) { },
        marriageRightClick: function (extra, id) { },
        nodeHeightSeperation: function (nodeWidth, nodeMaxHeight) {
          return TreeBuilder._nodeHeightSeperation(nodeWidth, nodeMaxHeight);
        },
        nodeRenderer: function (name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer) {
          return TreeBuilder._nodeRenderer(name, x, y, height, width, extra,
            id, nodeClass, textClass, textRenderer, options);
        },
        nodeSize: function (nodes, width, minHeight, textRenderer) {
          return TreeBuilder._nodeSize(nodes, width, minHeight, textRenderer);
        },
        nodeSorter: function (aName, aExtra, bName, bExtra) { return 0; },
        textRenderer: function (name, extra, textClass) {
          return TreeBuilder._textRenderer(name, extra, textClass, options);
        },
        marriageRenderer: function (x, y, height, width, extra, id, nodeClass) {
          return TreeBuilder._marriageRenderer(x, y, height, width, extra, id, nodeClass)
        },
        marriageSize: function (nodes, size) {
          return TreeBuilder._marriageSize(nodes, size)
        },
      },
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      nodeWidth: 100,
      nodeMinHeight: 0,
      marriageNodeSize: 10,
      styles: {
        node: 'node',
        marriageNode: 'marriageNode',
        linage: 'linage',
        marriage: 'marriage',
        text: 'nodeText'
      }
    });

    var data = this._preprocess(root, opts);
    var treeBuilder = new TreeBuilder(data.root, data.siblings, opts);
    treeBuilder.create();

    function _zoomTo(x, y, zoom = 1, duration = 500) {
      treeBuilder.svg
        .transition()
        .duration(duration)
        .call(
          treeBuilder.zoom.transform,
          d3.zoomIdentity
            .translate(opts.width / 2, opts.height / 2)
            .scale(zoom)
            .translate(-x, -y)
        )
    }

    return {
      resetZoom: function (duration = 500) {
        treeBuilder.svg
          .transition()
          .duration(duration)
          .call(
            treeBuilder.zoom.transform,
            d3.zoomIdentity.translate(opts.width / 2, opts.margin.top).scale(1)
          )
      },
      zoomTo: _zoomTo,
      zoomToNode: function (nodeId, zoom = 2, duration = 500) {
        const node = _.find(treeBuilder.allNodes, { data: { id: nodeId } })
        if (node) {
          _zoomTo(node.x, node.y, zoom, duration)
        }
      },
      zoomToFit: function (duration = 500) {
        const groupBounds = treeBuilder.g.node().getBBox()
        const width = groupBounds.width
        const height = groupBounds.height
        const fullWidth = treeBuilder.svg.node().clientWidth
        const fullHeight = treeBuilder.svg.node().clientHeight
        const scale = 0.95 / Math.max(width / fullWidth, height / fullHeight)

        treeBuilder.svg
          .transition()
          .duration(duration)
          .call(
            treeBuilder.zoom.transform,
            d3.zoomIdentity
              .translate(
                fullWidth / 2 - scale * (groupBounds.x + width / 2),
                fullHeight / 2 - scale * (groupBounds.y + height / 2)
              )
              .scale(scale)
          )
      }
    }
  },

  _preprocess: function (rootNode, opts) {
    var siblings = [];
    var id = 0;

    var root = {
      name: '',
      id: id++,
      hidden: true,
      children: []
    };

    var reconstructTree = function (person, parent, depth) {

      // Converte o 'person' para um D3 Node.
      var node = {
        name: person.name,
        id: id++,
        hidden: false,
        children: [],
        extra: person.extra,
        textClass: person.textClass ? person.textClass : opts.styles.text,
        class: person.class ? person.class : opts.styles.node
      };

      // Esconde linhas que sigam ao Nó Raíz.
      if (parent == root) {
        node.noParent = true;
      }

      // Aplica o 'depthOffset', posicionando o Nó na linha com a profundidade correta.
      for (var i = 0; i < (person.depthOffset - depth); i++) {
        var pushNode = {
          name: '',
          id: id++,
          hidden: true,
          children: [],
          noParent: node.noParent
        };
        parent.children.push(pushNode);
        parent = pushNode;
      }

      // Ordena os filhos.
      dTree._sortPersons(person.children, opts);

      // Adiciona os 'filhos diretos' do Nó.
      _.forEach(person.children, function (child) {
        reconstructTree(child, node, person.depthOffset);
      });

      // Adiciona o Nó ao Pai.
      parent.children.push(node);

      //Ordena os Casamentos.
      dTree._sortMarriages(person.marriages, opts);

      // Percorre todos os casamentos do Nó atual.
      _.forEach(person.marriages, function (marriage, index) {
        var sp = marriage.spouse;

        reconstructMarriageNode(marriage, index, parent, node, sp);
      });
    };

    var reconstructMarriageNode = function (marriage, index, parent, node, sp) {
      // Cria o Nó de Casamento.
      var m = {
        name: '',
        id: id++,
        hidden: opts.hideMarriageNodes,
        noParent: true,
        children: [],
        isMarriage: true,
        extra: marriage.extra,
        class: marriage.class ? marriage.class : opts.styles.marriageNode
      }

      // Cria o Nó do Esposo(a).
      var spouse = {
        name: sp.name,
        id: id++,
        hidden: false,
        noParent: true,
        children: [],
        textClass: sp.textClass ? sp.textClass : opts.styles.text,
        class: sp.class ? sp.class : opts.styles.node,
        extra: sp.extra,
        marriageNode: m
      };

      parent.children.push(m, spouse);

      dTree._sortPersons(marriage.children, opts);
      _.forEach(marriage.children, function (child) {
        reconstructTree(child, m, sp.depthOffset);
      });

      siblings.push({
        source: {
          id: node.id
        },
        target: {
          id: spouse.id
        },
        number: index,
        active: marriage.active
      });

      if (sp.marriages.length > 0) {
        _.forEach(sp.marriages, function (marriage, index) {
          var os = marriage.spouse;
          reconstructMarriageNode(marriage, index, parent, spouse, os);
        });
      }
    }

    // Inicia a construção da Árvore a partir do Nó Raíz.
    reconstructTree(rootNode, root, 0);

    return {
      root: d3.hierarchy(root),
      siblings: siblings
    };

  },

  _sortPersons: function (persons, opts) {
    if (persons != undefined) {
      persons.sort(function (a, b) {
        return opts.callbacks.nodeSorter.call(this, a.name, a.extra, b.name, b.extra);
      });
    }
    return persons;
  },

  _sortMarriages: function (marriages, opts) {
    if (marriages != undefined && Array.isArray(marriages)) {
      marriages.sort(function (marriageA, marriageB) {
        var a = marriageA.spouse;
        var b = marriageB.spouse;
        return opts.callbacks.nodeSorter.call(this, a.name, a.extra, b.name, b.extra);
      });
    }
    return marriages;
  }

};

export default dTree;