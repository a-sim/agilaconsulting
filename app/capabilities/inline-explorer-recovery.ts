export const INLINE_EXPLORER_RECOVERY = String.raw`
(function () {
  var timer = window.setTimeout(activate, 1800);

  function activate() {
    var root = document.querySelector("[data-capability-explorer]");
    var payloadNode = document.getElementById("agila-capability-recovery-data");
    if (!root || !payloadNode || root.getAttribute("data-react-ready") === "true") {
      return;
    }

    var payload;
    try {
      payload = JSON.parse(payloadNode.textContent || "");
    } catch (error) {
      return;
    }

    var model = payload.model;
    var colours = payload.colours || {};
    var classes = payload.classes;
    var canvas = root.querySelector('canvas[data-renderer="native-recovery"]');
    var fallback = root.querySelector("[data-recovery-fallback]");
    var status = root.querySelector("[data-recovery-status]");
    var hint = root.querySelector("[data-recovery-hint]");
    var inspector = root.querySelector("[data-recovery-inspector]");
    var search = root.querySelector("#capability-search");
    if (!canvas || !fallback || !status || !hint || !inspector || !search) return;

    var active = true;
    var listeners = [];
    var focus = { type: "overview" };
    var view = { zoom: 1, x: 0, y: 0 };
    var hitTargets = [];
    var pointer = null;
    var suppressClick = false;
    var domainsById = {};
    var clustersById = {};
    var componentsById = {};
    var nodes = [{ id: "agila", label: "Agila", role: "root", colour: "#F7F7F4", x: 500, y: 370 }];
    var edges = [];
    var nodeById = { agila: nodes[0] };
    var domainPoints = {
      transformation: { x: 225, y: 180 },
      architecture: { x: 750, y: 165 },
      industrial: { x: 805, y: 365 },
      "data-ai": { x: 710, y: 570 },
      "digital-products": { x: 385, y: 610 },
      governance: { x: 185, y: 405 },
    };

    function listen(target, name, handler, options) {
      target.addEventListener(name, handler, options);
      listeners.push(function () {
        target.removeEventListener(name, handler, options);
      });
    }

    function point(cx, cy, radius, angle) {
      return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    }

    model.domains.forEach(function (domain, domainIndex) {
      domainsById[domain.id] = domain;
      var domainPoint = domainPoints[domain.id] || point(500, 370, 225, (-90 + domainIndex * 60) * Math.PI / 180);
      var domainAngle = Math.atan2(domainPoint.y - 370, domainPoint.x - 500);
      var colour = colours[domain.id] || "#A9AAA5";
      var domainNode = {
        id: domain.id,
        label: domain.title,
        role: "domain",
        colour: colour,
        domainId: domain.id,
        x: domainPoint.x,
        y: domainPoint.y,
      };
      nodes.push(domainNode);
      nodeById[domain.id] = domainNode;
      edges.push({ source: "agila", target: domain.id, kind: "hierarchy" });

      domain.clusters.forEach(function (cluster, clusterIndex) {
        clustersById[cluster.id] = { domain: domain, cluster: cluster };
        var spread = (clusterIndex - (domain.clusters.length - 1) / 2) * 0.48;
        var clusterPoint = point(domainPoint.x, domainPoint.y, 82 + (clusterIndex % 2) * 14, domainAngle + spread);
        var clusterNode = {
          id: cluster.id,
          label: cluster.title,
          role: "cluster",
          colour: colour,
          domainId: domain.id,
          x: clusterPoint.x,
          y: clusterPoint.y,
        };
        nodes.push(clusterNode);
        nodeById[cluster.id] = clusterNode;
        edges.push({ source: domain.id, target: cluster.id, kind: "hierarchy" });

        var componentRadius = cluster.components.length > 4 ? 42 : 31;
        cluster.components.forEach(function (component, componentIndex) {
          componentsById[component.id] = {
            domain: domain,
            cluster: cluster,
            component: component,
          };
          var componentPoint = point(
            clusterPoint.x,
            clusterPoint.y,
            componentRadius,
            (Math.PI * 2 * componentIndex) / cluster.components.length,
          );
          var componentNode = {
            id: component.id,
            label: component.title,
            role: "component",
            colour: colour,
            domainId: domain.id,
            x: componentPoint.x,
            y: componentPoint.y,
          };
          nodes.push(componentNode);
          nodeById[component.id] = componentNode;
          edges.push({
            source: cluster.id,
            target: component.id,
            kind: "hierarchy",
          });
        });
      });
    });

    model.relationships.forEach(function (relationship) {
      edges.push({
        id: relationship.id,
        source: relationship.source,
        target: relationship.target,
        kind: "bridge",
      });
    });

    function selectedEntries() {
      if (focus.type === "domain") {
        return { domain: domainsById[focus.id] };
      }
      if (focus.type === "cluster") return clustersById[focus.id] || {};
      if (focus.type === "component") return componentsById[focus.id] || {};
      return {};
    }

    function presentation() {
      var visible = { agila: true };
      var selected = {};
      var context = {};
      var bridges = {};
      var entries = selectedEntries();
      var selectedDomain = entries.domain;
      var selectedCluster = entries.cluster;

      model.domains.forEach(function (domain) {
        visible[domain.id] = true;
      });
      if (focus.type === "overview" || focus.type === "all") {
        model.domains.forEach(function (domain) {
          domain.clusters.forEach(function (cluster) {
            visible[cluster.id] = true;
            cluster.components.forEach(function (component) {
              visible[component.id] = true;
            });
          });
        });
        model.relationships.forEach(function (relationship) {
          bridges[relationship.id] = true;
        });
      }
      if (selectedDomain) {
        selected[selectedDomain.id] = true;
        var local = {};
        selectedDomain.clusters.forEach(function (cluster) {
          visible[cluster.id] = true;
          local[cluster.id] = true;
          if (!selectedCluster) {
            cluster.components.forEach(function (component) {
              visible[component.id] = true;
            });
          }
        });
        model.relationships.forEach(function (relationship) {
          var localSource = local[relationship.source];
          var localTarget = local[relationship.target];
          if (localSource || localTarget) {
            bridges[relationship.id] = true;
            visible[relationship.source] = true;
            visible[relationship.target] = true;
            if (!localSource) context[relationship.source] = true;
            if (!localTarget) context[relationship.target] = true;
          }
        });
      }
      if (selectedCluster) {
        selected[selectedCluster.id] = true;
        selectedCluster.components.forEach(function (component) {
          visible[component.id] = true;
        });
      }
      if (focus.type === "component") selected[focus.id] = true;
      return {
        visible: visible,
        selected: selected,
        context: context,
        bridges: bridges,
        domainId: selectedDomain && selectedDomain.id,
      };
    }

    function draw() {
      if (!active) return;
      var width = canvas.clientWidth;
      var height = canvas.clientHeight;
      var context2d = canvas.getContext && canvas.getContext("2d");
      if (!context2d || width < 1 || height < 1) return;
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context2d.setTransform(ratio, 0, 0, ratio, 0, 0);
      context2d.clearRect(0, 0, width, height);

      var state = presentation();
      var visibleNodes = nodes.filter(function (node) {
        return state.visible[node.id];
      });
      var xs = visibleNodes.map(function (node) { return node.x; });
      var ys = visibleNodes.map(function (node) { return node.y; });
      var minX = Math.min.apply(Math, xs);
      var maxX = Math.max.apply(Math, xs);
      var minY = Math.min.apply(Math, ys);
      var maxY = Math.max.apply(Math, ys);
      var scale = Math.max(
        0.2,
        Math.min(
          (width - 150) / Math.max(maxX - minX, 320),
          (height - 150) / Math.max(maxY - minY, 320),
        ),
      );
      var centreX = (minX + maxX) / 2;
      var centreY = (minY + maxY) / 2;

      function screen(node) {
        return {
          x: width / 2 + view.x + (node.x - centreX) * scale * view.zoom,
          y: height / 2 + view.y + (node.y - centreY) * scale * view.zoom,
        };
      }

      edges.forEach(function (edge) {
        if (
          !state.visible[edge.source] ||
          !state.visible[edge.target] ||
          (edge.kind === "bridge" && !state.bridges[edge.id])
        ) return;
        var source = nodeById[edge.source];
        var target = nodeById[edge.target];
        if (!source || !target) return;
        var from = screen(source);
        var to = screen(target);
        context2d.beginPath();
        context2d.setLineDash(edge.kind === "bridge" ? [5, 6] : []);
        context2d.strokeStyle = edge.kind === "bridge" ? "#D8DEE6" : target.colour;
        context2d.globalAlpha = edge.kind === "bridge" ? 0.44 : 0.3;
        context2d.lineWidth = edge.kind === "bridge" ? 1.1 : 0.85;
        context2d.moveTo(from.x, from.y);
        context2d.lineTo(to.x, to.y);
        context2d.stroke();
      });

      hitTargets = [];
      visibleNodes.forEach(function (node) {
        var position = screen(node);
        var radius = node.role === "root" ? 19 : node.role === "domain" ? 20 : node.role === "cluster" ? 9 : 4.2;
        var dimmed = state.domainId && node.role === "domain" && node.id !== state.domainId;
        context2d.globalAlpha = state.context[node.id] ? 0.5 : dimmed ? 0.16 : 1;
        context2d.fillStyle = node.colour;
        context2d.strokeStyle = "#ffffff";
        context2d.lineWidth = state.selected[node.id] ? 4 : 1.5;
        context2d.beginPath();
        context2d.arc(position.x, position.y, radius, 0, Math.PI * 2);
        context2d.fill();
        context2d.stroke();
        var showLabel = node.role !== "component" || view.zoom > 1.45 || state.selected[node.id];
        if (showLabel) {
          var label = node.label.length > 38 ? node.label.slice(0, 37) + "…" : node.label;
          var fontSize = node.role === "root" || node.role === "domain" ? 13 : node.role === "component" ? 8 : 10;
          context2d.font = (node.role === "root" || node.role === "domain" ? "700 " : "600 ") + fontSize + "px Manrope, Arial, sans-serif";
          context2d.textAlign = "center";
          context2d.textBaseline = "middle";
          var labelY = position.y - radius - 12;
          context2d.lineWidth = 3.2;
          context2d.strokeStyle = "rgba(7,10,15,.96)";
          context2d.strokeText(label, position.x, labelY);
          context2d.fillStyle = "#f7f7f4";
          context2d.fillText(label, position.x, labelY);
        }
        hitTargets.push({
          node: node,
          x: position.x,
          y: position.y,
          radius: node.role === "root" ? 42 : Math.max(radius, 18),
        });
      });
      context2d.globalAlpha = 1;
      canvas.setAttribute("data-ready", "true");
      canvas.setAttribute("data-colour-mode", "domain");
      canvas.setAttribute("data-layout", "clustered-islands");
      fallback.setAttribute("data-hidden", "true");
      status.textContent = "Interactive map ready · " + visibleNodes.length + " nodes";
      hint.textContent = "Scroll to zoom · drag to pan · select a node";
    }

    function element(tag, className, text) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      if (typeof text === "string") node.textContent = text;
      return node;
    }

    function focusButton(label, type, id) {
      var button = element("button", "", label);
      button.type = "button";
      button.onclick = function () { setFocus({ type: type, id: id }); };
      return button;
    }

    function renderInspector() {
      while (inspector.firstChild) inspector.removeChild(inspector.firstChild);
      var topline = element("div", classes.inspectorTopline);
      topline.appendChild(element("span", "", "Selected capability"));
      var share = element("button", "", "Share view");
      share.type = "button";
      share.onclick = function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(window.location.href);
        }
      };
      topline.appendChild(share);
      inspector.appendChild(topline);

      var entries = selectedEntries();
      var domain = entries.domain;
      var cluster = entries.cluster;
      var component = entries.component;
      if (!domain) {
        var empty = element("div", classes.inspectorEmpty);
        empty.appendChild(element("span", "", "A"));
        empty.appendChild(element("h3", "", "Start with one of six domains."));
        empty.appendChild(element("p", "", "Select a domain to see its capability areas. Choose an area to continue into its components and connections."));
        inspector.appendChild(empty);
        return;
      }

      var content = element("div", classes.inspectorContent);
      var breadcrumbs = element("div", classes.breadcrumbs);
      breadcrumbs.appendChild(focusButton("Agila", "overview"));
      breadcrumbs.appendChild(element("span", "", "/"));
      breadcrumbs.appendChild(focusButton(domain.title, "domain", domain.id));
      if (cluster) {
        breadcrumbs.appendChild(element("span", "", "/"));
        breadcrumbs.appendChild(focusButton(cluster.title, "cluster", cluster.id));
      }
      content.appendChild(breadcrumbs);
      content.appendChild(element("p", classes.inspectorRole, component ? "Component capability" : cluster ? "Capability area" : domain.strategicRole));
      content.appendChild(element("h3", "", component ? component.title : cluster ? cluster.title : domain.title));
      content.appendChild(element("p", "", component ? "A component capability within " + cluster.title + "." : cluster ? cluster.summary : domain.description));

      var list = element("div", classes.inspectorList);
      list.appendChild(element("p", "", cluster ? "Component capabilities" : "Capability areas"));
      (cluster ? cluster.components : domain.clusters).forEach(function (item) {
        var button = focusButton(item.title, cluster ? "component" : "cluster", item.id);
        var arrow = element("span", "", "→");
        arrow.setAttribute("aria-hidden", "true");
        button.textContent = "";
        button.appendChild(element("span", "", item.title));
        button.appendChild(arrow);
        list.appendChild(button);
      });
      content.appendChild(list);
      inspector.appendChild(content);
    }

    function hashFor(nextFocus) {
      if (nextFocus.type === "all") return "#all-capability-areas";
      if (nextFocus.type === "domain") return "#domain=" + nextFocus.id;
      if (nextFocus.type === "cluster") return "#area=" + nextFocus.id;
      if (nextFocus.type === "component") return "#capability=" + nextFocus.id;
      return "#explorer";
    }

    function parseHash() {
      var value = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (value === "all-capability-areas") return { type: "all" };
      if (value.indexOf("domain=") === 0 && domainsById[value.slice(7)]) return { type: "domain", id: value.slice(7) };
      if (value.indexOf("area=") === 0 && clustersById[value.slice(5)]) return { type: "cluster", id: value.slice(5) };
      if (value.indexOf("capability=") === 0 && componentsById[value.slice(11)]) return { type: "component", id: value.slice(11) };
      return { type: "overview" };
    }

    function clearSearchResults() {
      var results = root.querySelector("[data-recovery-results]");
      if (results && results.parentNode) results.parentNode.removeChild(results);
    }

    function setFocus(nextFocus, push) {
      focus = nextFocus;
      view = { zoom: 1, x: 0, y: 0 };
      search.value = "";
      clearSearchResults();
      if (push !== false && window.location.hash !== hashFor(nextFocus)) {
        window.history.pushState({}, "", hashFor(nextFocus));
      }
      root.querySelectorAll("[data-recovery-view]").forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.getAttribute("data-recovery-view") === nextFocus.type));
      });
      var entries = selectedEntries();
      root.querySelectorAll("[data-recovery-domain]").forEach(function (button) {
        button.setAttribute("aria-pressed", String(entries.domain && button.getAttribute("data-recovery-domain") === entries.domain.id));
      });
      renderInspector();
      draw();
    }

    root.querySelectorAll("[data-recovery-view]").forEach(function (button) {
      listen(button, "click", function () {
        setFocus({ type: button.getAttribute("data-recovery-view") });
      });
    });
    root.querySelectorAll("[data-recovery-domain]").forEach(function (button) {
      listen(button, "click", function () {
        setFocus({ type: "domain", id: button.getAttribute("data-recovery-domain") });
      });
    });

    listen(search, "input", function () {
      clearSearchResults();
      var query = search.value.trim().toLowerCase();
      if (query.length < 2) return;
      var items = [];
      model.domains.forEach(function (domain) {
        items.push({ id: domain.id, title: domain.title, type: "domain", context: domain.strategicRole });
        domain.clusters.forEach(function (cluster) {
          items.push({ id: cluster.id, title: cluster.title, type: "cluster", context: domain.title });
          cluster.components.forEach(function (component) {
            items.push({ id: component.id, title: component.title, type: "component", context: domain.title + " / " + cluster.title });
          });
        });
      });
      items = items.filter(function (item) {
        return (item.title + " " + item.context).toLowerCase().indexOf(query) !== -1;
      }).slice(0, 8);
      if (!items.length) return;
      var list = element("ul", classes.searchResults);
      list.setAttribute("data-recovery-results", "true");
      items.forEach(function (item) {
        var listItem = element("li");
        var button = element("button");
        button.type = "button";
        button.appendChild(element("span", "", item.title));
        button.appendChild(element("small", "", item.context));
        button.onclick = function () { setFocus({ type: item.type, id: item.id }); };
        listItem.appendChild(button);
        list.appendChild(listItem);
      });
      search.parentNode.appendChild(list);
    });

    listen(canvas, "wheel", function (event) {
      event.preventDefault();
      view.zoom = Math.min(2.4, Math.max(0.55, view.zoom * Math.exp(-event.deltaY * 0.0015)));
      draw();
    }, { passive: false });
    listen(canvas, "pointerdown", function (event) {
      pointer = { x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y, moved: false };
      if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
    });
    listen(canvas, "pointermove", function (event) {
      if (!pointer) return;
      var dx = event.clientX - pointer.x;
      var dy = event.clientY - pointer.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) pointer.moved = true;
      view.x = pointer.viewX + dx;
      view.y = pointer.viewY + dy;
      draw();
    });
    listen(canvas, "pointerup", function () {
      suppressClick = Boolean(pointer && pointer.moved);
      pointer = null;
    });
    listen(canvas, "click", function (event) {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      var rect = canvas.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      for (var index = 0; index < hitTargets.length; index += 1) {
        var target = hitTargets[index];
        var dx = target.x - x;
        var dy = target.y - y;
        if (Math.sqrt(dx * dx + dy * dy) <= target.radius) {
          setFocus({ type: target.node.role === "root" ? "overview" : target.node.role, id: target.node.id });
          return;
        }
      }
    });
    listen(window, "resize", draw);
    listen(window, "hashchange", function () { setFocus(parseHash(), false); });

    root.setAttribute("data-recovery-active", "true");
    window.__agilaCapabilityRecoveryCleanup = function () {
      active = false;
      window.clearTimeout(timer);
      listeners.forEach(function (remove) { remove(); });
      listeners = [];
      delete window.__agilaCapabilityRecoveryCleanup;
    };
    setFocus(parseHash(), false);
  }
})();
`;
