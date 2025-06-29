class FilePicker extends HandlebarsApplicationMixin(ApplicationV2) {
  /**
   * @param {DeepPartial<ApplicationConfiguration & FilePickerConfiguration>} [options={}] Options that configure the
   *                                                                                       behavior of the FilePicker
   */
  constructor(options={}) {
    super(options);

    /**
     * The full requested path given by the user
     * @type {string}
     */
    this.request = options.current ?? "";

    /**
     * A callback function to trigger once a file has been selected
     * @type {Function|null}
     */
    this.callback = options.callback ?? null;

    /**
     * The general file type which controls the set of extensions which will be accepted
     * @type {string}
     */
    this.type = options.type ?? "any";

    /**
     * The target HTML element this file picker is bound to
     * @type {HTMLElement|null}
     */
    this.field = options.field ?? null;

    /**
     * A button controlling the display of the picker UI
     * @type {HTMLElement|null}
     */
    this.button = options.button ?? null;

    /**
     * The display mode of the FilePicker UI
     * @type {string}
     */
    this.displayMode = options.displayMode ?? this.constructor.LAST_DISPLAY_MODE;

    /**
     * The file sources available for browsing
     * @type {Record<"data"|"public"|"s3", {target: string; bucket?: string; buckets?: string[]}|undefined>}>
     */
    this.sources = ["data", "public", "s3"]
      .filter(s => game.data.files.storages.includes(s))
      .reduce((sources, key) => {
        sources[key] = key === "s3" ? {target: "", bucket: "", buckets: []} : {target: ""};
        return sources;
      }, {});

    // Infer the source
    const [source, target] = this._inferSourceAndTarget(this.request);
    this.sources[source].target = target;

    /**
     * Track the active source tab which is being browsed
     * @type {"data"|"public"|"s3"}
     */
    this.activeSource = source;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "file-picker",
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
      icon: "fa-solid fa-file-magnifying-glass"
    },
    position: {
      width: 560
    },
    tileSize: false,
    actions: {
      backTraverse: FilePicker.#onBackTraverse,
      makeDirectory: FilePicker.#onMakeDirectory,
      togglePrivacy: FilePicker.#onTogglePrivacy,
      changeDisplayMode: FilePicker.#onChangeDisplayMode,
      pickDirectory: FilePicker.#onPickDirectory,
      pickFile: FilePicker.#onPickFile,
      goToFavorite: FilePicker.#onGoToFavorite,
      setFavorite: FilePicker.#onSetFavorite,
      removeFavorite: FilePicker.#onRemoveFavorite
    },
    form: {
      handler: FilePicker.#onSubmit,
      submitOnChange: false,
      closeOnSubmit: false
    }
  };

  /** @override */
  static PARTS = {
    tabs: {template: "templates/generic/tab-navigation.hbs"},
    subheader: {template: "templates/apps/file-picker/subheader.hbs"},
    body: {template: "templates/apps/file-picker/body.hbs"},
    subfooter: {template: "templates/apps/file-picker/subfooter.hbs"},
    footer: {template: "templates/generic/form-footer.hbs"}
  };

  /** @override */
  static TABS = {
    sources: {
      tabs: [
        {id: "data", icon: "fa-solid fa-database"},
        {id: "public", icon: "fa-solid fa-server"},
        {id: "s3", icon: "fa-solid fa-cloud-arrow-up"}
      ],
      initial: "data",
      labelPrefix: "FILES.TABS"
    }
  };

  /**
   * The allowed values for the type of this FilePicker instance.
   * @type {string[]}
   */
  static FILE_TYPES = ["any", "audio", "folder", "font", "graphics", "image", "imagevideo", "text", "video"];

  /**
   * Record the last-browsed directory path so that re-opening a different FilePicker instance uses the same target
   * @type {string}
   */
  static LAST_BROWSED_DIRECTORY = "";

  /**
   * Record the last-configured tile size which can automatically be applied to new FilePicker instances
   * @type {number|null}
   */
  static LAST_TILE_SIZE = null;

  /**
   * Record the last-configured display mode so that re-opening a different FilePicker instance uses the same mode.
   * @type {string}
   */
  static LAST_DISPLAY_MODE = "list";

  /**
   * Enumerate the allowed FilePicker display modes
   * @type {string[]}
   */
  static DISPLAY_MODES = ["list", "thumbs", "tiles", "images"];

  /**
   * Cache the names of S3 buckets which can be used
   * @type {Array|null}
   */
  static S3_BUCKETS = null;

  /**
   * Return the upload URL to which the FilePicker should post uploaded files
   * @type {string}
   */
  static get uploadURL() {
    return foundry.utils.getRoute("upload");
  }

  /**
   * Retrieve the configured FilePicker implementation.
   * @type {typeof FilePicker}
   */
  static get implementation() {
    if ( !foundry.utils.isSubclass(CONFIG.ux.FilePicker, FilePicker) ) {
      console.warn("Configured TextEditor override must be a subclass of TextEditor.");
      CONFIG.ux.FilePicker = FilePicker;
    }
    return CONFIG.ux.FilePicker;
  }

  /* -------------------------------------------- */

  /**
   * Track whether we have loaded files.
   * @type {boolean}
   */
  #loaded = false;

  /**
   * The latest set of results browsed from the server
   * @type {object}
   */
  results = {};

  /**
   * The current set of file extensions which are being filtered upon
   * @type {string[]}
   */
  extensions = FilePicker.#getExtensions(this.options.type ?? "any");

  #search = new SearchFilter({
    inputSelector: "input[name=filter]",
    contentSelector: "section[data-files]",
    callback: this._onSearchFilter.bind(this)
  });

  /**
   * Get favorite folders for quick access
   * @type {Record<string, FavoriteFolder>}
   */
  get favorites() {
    return game.settings.get("core", "favoritePaths");
  }

  /** @override */
  get title() {
    const type = this.type || "file";
    return game.i18n.localize(type === "imagevideo" ? "FILES.TitleImageVideo" : `FILES.Title${type.capitalize()}`);
  }

  /**
   * Return the source object for the currently active source
   * @type {object}
   */
  get source() {
    return this.sources[this.activeSource];
  }

  /**
   * Return the target directory for the currently active source
   * @type {string}
   */
  get target() {
    return this.source.target;
  }

  /**
   * Whether the current user is able to create folders.
   * @type {boolean}
   */
  get canCreateFolder() {
    if ( this.options.allowUpload === false ) return false;
    if ( !["data", "s3"].includes(this.activeSource) ) return false;
    const isData = this.activeSource === "data";
    // Prevent uploading into the root package directories.
    if ( isData && ["worlds", "systems", "modules"].includes(this.source.target) ) return false;
    // Prevent uploading into a world or system that is not this one.
    for ( const [pkg, path] of [[game.world, "worlds/"], [game.system, "systems/"]] ) {
      if ( pkg && isData && this.source.target.startsWith(path) ) {
        const [, id] = this.source.target.split("/");
        if ( id !== pkg.id ) return false;
      }
    }
    // Prevent uploading into a module or system directory unless the canUpload flag is present.
    if ( isData && (this.source.target.startsWith("systems/") || this.source.target.startsWith("modules/")) ) {
      const [type, id] = this.source.target.split("/");
      const pkg = type === "systems" ? (game.system ?? game.systems?.get(id)) : game.modules.get(id);
      if ( !pkg?.flags.canUpload ) return false;
    }
    return game.user?.can("FILES_UPLOAD") !== false;
  }

  /* -------------------------------------------- */

  /**
   * Whether the current use is able to upload file content.
   * @type {boolean}
   */
  get canUpload() {
    if ( !this.canCreateFolder ) return false;
    if ( this.type === "folder" ) return false;
    // Prevent uploading to the root of Data/.
    return (this.activeSource !== "data") || (this.source.target !== "");
  }

  /* -------------------------------------------- */

  /**
   * Get the valid file extensions for a given named file picker type
   * @param {string} type
   * @returns {string[]}
   */
  static #getExtensions(type) {
    const types = (() => {
      switch ( type ) {
        case "audio": return Object.keys(CONST.AUDIO_FILE_EXTENSIONS);
        case "folder": return [];
        case "font": return Object.keys(CONST.FONT_FILE_EXTENSIONS);
        case "graphics": return Object.keys(CONST.GRAPHICS_FILE_EXTENSIONS);
        case "image": return Object.keys(CONST.IMAGE_FILE_EXTENSIONS);
        case "imagevideo":
          return Object.keys(CONST.IMAGE_FILE_EXTENSIONS).concat(Object.keys(CONST.VIDEO_FILE_EXTENSIONS));
        case "text": return Object.keys(CONST.TEXT_FILE_EXTENSIONS);
        case "video": return Object.keys(CONST.VIDEO_FILE_EXTENSIONS);
        default: return Object.keys(CONST.UPLOADABLE_FILE_EXTENSIONS);
      }
    })();
    return types.map(t => `.${t}`);
  }

  /* -------------------------------------------- */

  /**
   * Test a URL to see if it matches a well known s3 key pattern
   * @param {string} url          An input URL to test
   * @returns {RegExpMatchArray|null}  A regular expression match
   */
  static matchS3URL(url) {
    const endpoint = game.data.files.s3?.endpoint;
    if ( !endpoint ) return null;

    // Match new style S3 urls
    const s3New = new RegExp(`^${endpoint.protocol}//(?<bucket>.*).${endpoint.host}/(?<key>.*)`);
    const matchNew = url.match(s3New);
    if ( matchNew ) return matchNew;

    // Match old style S3 urls
    const s3Old = new RegExp(`^${endpoint.protocol}//${endpoint.host}/(?<bucket>[^/]+)/(?<key>.*)`);
    return url.match(s3Old);
  }

  /* -------------------------------------------- */

  /**
   * Browse files for a certain directory location
   * @param {string} source     The source location in which to browse: see FilePicker#sources for details.
   * @param {string} target     The target within the source location
   * @param {object} options                Optional arguments
   * @param {string} [options.bucket]       A bucket within which to search if using the S3 source
   * @param {string[]} [options.extensions] An Array of file extensions to filter on
   * @param {boolean} [options.wildcard]    The requested dir represents a wildcard path
   *
   * @returns {Promise<object>} A Promise that resolves to the directories and files contained in the location
   */
  static async browse(source, target, options={}) {
    const data = {action: "browseFiles", storage: source, target};
    return FilePicker.#manageFiles(data, options);
  }

  /* -------------------------------------------- */

  /**
   * Configure metadata settings regarding a certain file system path
   * @param {string} source     The source location in which to browse: see FilePicker#sources for details.
   * @param {string} target     The target within the source location
   * @param {object} options    Optional arguments modifying the request
   * @returns {Promise<object>}
   */
  static async configurePath(source, target, options={}) {
    const data = {action: "configurePath", storage: source, target: target};
    return FilePicker.#manageFiles(data, options);
  }

  /* -------------------------------------------- */

  /**
   * Create a subdirectory within a given source. The requested subdirectory path must not already exist.
   * @param {string} source     The source location in which to browse. See FilePicker#sources for details
   * @param {string} target     The target within the source location
   * @param {object} options    Optional arguments which modify the request
   * @returns {Promise<object>}
   */
  static async createDirectory(source, target, options={}) {
    const data = {action: "createDirectory", storage: source, target: target};
    return FilePicker.#manageFiles(data, options);
  }

  /* -------------------------------------------- */

  /**
   * General dispatcher method to submit file management commands to the server
   * @param {object} data         Request data dispatched to the server
   * @param {object} options      Options dispatched to the server
   * @returns {Promise<object>}   The server response
   */
  static async #manageFiles(data, options) {
    return new Promise((resolve, reject) => {
      game.socket.emit("manageFiles", data, options, result => {
        if ( result.error ) return reject(new Error(result.error));
        resolve(result);
      });
    });
  }

  /* -------------------------------------------- */

  /**
   * Dispatch a POST request to the server containing a directory path and a file to upload
   * @param {string} source   The data source to which the file should be uploaded
   * @param {string} path     The destination path
   * @param {File} file       The File object to upload
   * @param {object} [body={}]  Additional file upload options sent in the POST body
   * @param {object} [options]  Additional options to configure how the method behaves
   * @param {boolean} [options.notify=true] Display a UI notification when the upload is processed
   * @returns {Promise<object>}  The response object
   */
  static async upload(source, path, file, body={}, options={}) {
    if ( this !== CONFIG.ux.FilePicker ) return FilePicker.implementation.upload(source, path, file, body, options);
    const notify = options.notify ?? true;

    // Create the form data to post
    const fd = new FormData();
    fd.set("source", source);
    fd.set("target", path);
    fd.set("upload", file);
    Object.entries(body).forEach(o => fd.set(...o));

    const notifications = Object.fromEntries(["ErrorSomethingWrong", "WarnUploadModules", "ErrorTooLarge"].map(key => {
      const i18n = `FILES.${key}`;
      return [key, game.i18n.localize(i18n)];
    }));

    // Dispatch the request
    try {
      const request = await fetch(this.uploadURL, {method: "POST", body: fd});
      const response = await request.json();

      // Attempt to obtain the response
      if ( response.error ) {
        ui.notifications.error(response.error);
        return false;
      } else if ( !response.path ) {
        if ( notify ) ui.notifications.error(notifications.ErrorSomethingWrong);
        else console.error(notifications.ErrorSomethingWrong);
        return;
      }

      // Check for uploads to system or module directories.
      const [packageType, packageId, folder] = response.path.split("/");
      if ( ["modules", "systems"].includes(packageType) ) {
        let pkg;
        if ( packageType === "modules" ) pkg = game.modules.get(packageId);
        else if ( packageId === game.system.id ) pkg = game.system;
        if ( !pkg?.persistentStorage || (folder !== "storage") ) {
          if ( notify ) ui.notifications.warn(notifications.WarnUploadModules);
          else console.warn(notifications.WarnUploadModules);
        }
      }

      // Display additional response messages
      if ( response.message ) {
        if ( notify ) ui.notifications.info(response.message);
        else console.info(response.message);
      }
      return response;
    }
    catch(e) {
      if ( (e instanceof foundry.utils.HttpError) && (e.code === 413) ) {
        if ( notify ) ui.notifications.error(notifications.ErrorTooLarge);
        else console.error(notifications.ErrorTooLarge);
        return;
      }
      return {};
    }
  }

  /* -------------------------------------------- */

  /**
   * A convenience function that uploads a file to a given package's persistent /storage/ directory
   * @param {string} packageId                The id of the package to which the file should be uploaded.
   *                                          Only supports Systems and Modules.
   * @param {string} path                     The relative destination path in the package's storage directory
   * @param {File} file                       The File object to upload
   * @param {object} [body={}]                Additional file upload options sent in the POST body
   * @param {object} [options]                Additional options to configure how the method behaves
   * @param {boolean} [options.notify=true]   Display a UI notification when the upload is processed
   * @returns {Promise<object>}               The response object
   */
  static async uploadPersistent(packageId, path, file, body={}, {notify=true}={}) {
    const pack = game.system.id === packageId ? game.system : game.modules.get(packageId);
    if ( !pack ) throw new Error(`Package ${packageId} not found`);
    if ( !pack.persistentStorage ) throw new Error(`Package ${packageId} does not have persistent storage enabled. `
      + "Set the \"persistentStorage\" flag to true in the package manifest.");
    const source = "data";
    const target = `${pack.type}s/${pack.id}/storage/${path}`;
    return this.upload(source, target, file, body, {notify});
  }

  /* -------------------------------------------- */

  /**
   * Request wildcard token images from the server and return them.
   * @param {string} actorId         The actor whose prototype token contains the wildcard image path.
   * @param {object} [options]
   * @param {string} [options.pack]  The ID of the compendium the actor is in.
   * @returns {Promise<string[]>}
   */
  static requestTokenImages(actorId, options={}) {
    return new Promise((resolve, reject) => {
      game.socket.emit("requestTokenImages", actorId, options, result => {
        if ( result.error ) return reject(new Error(result.error));
        resolve(result.files);
      });
    });
  }

  /* -------------------------------------------- */

  /**
   * Given a current file path, determine the directory to which it belongs.
   * @param {string} target   The currently requested target path
   * @returns {[source: string, revisedTarget: string]} A tuple of the inferred source and target directory path
   * @protected
   */
  _inferSourceAndTarget(target) {

    // Determine target
    const ignored = [CONST.DEFAULT_TOKEN].concat(this.options.redirectToRoot ?? []);
    if ( !target || ignored.includes(target) ) target = this.constructor.LAST_BROWSED_DIRECTORY;
    let source = "data";

    // Check for s3 matches
    const s3Match = this.constructor.matchS3URL(target);
    if ( s3Match ) {
      this.sources.s3.bucket = s3Match.groups.bucket;
      source = "s3";
      target = s3Match.groups.key;
    }

    // Non-s3 URL matches
    else if ( ["http://", "https://"].some(c => target.startsWith(c)) ) target = "";

    // Local file matches
    else {
      const p0 = target.split("/").shift();
      if ( FILE_PICKER_PUBLIC_DIRS.includes(p0) ) source = "public";
    }

    // If the preferred source is not available, use the next available source.
    if ( !this.sources[source] ) {
      source = game.data.files.storages[0];
      // If that happens to be S3, pick the first available bucket.
      if ( source === "s3" ) {
        this.sources.s3.bucket = game.data.files.s3.buckets?.[0] ?? null;
        target = "";
      }
    }

    // Split off the file name and retrieve just the directory path
    const parts = target.split("/");
    if ( parts[parts.length - 1].indexOf(".") !== -1 ) parts.pop();
    const dir = parts.join("/");
    return [source, dir];
  }

  /* -------------------------------------------- */

  /**
   * Validate that the extension of the uploaded file is permitted for this file-picker instance.
   * This is an initial client-side test, the MIME type will be further checked by the server.
   * @param {string} name       The file name attempted for upload
   */
  #validateExtension(name) {
    const ext = `.${name.split(".").pop()}`;
    if ( !this.extensions.includes(ext) ) {
      const msg = game.i18n.format("FILES.ErrorDisallowedExtension", {name, ext, allowed: this.extensions.join(" ")});
      throw new Error(msg);
    }
  }

  /* -------------------------------------------- */

  /**
   * Present the user with a dialog to create a subdirectory within their currently browsed file storage location.
   * @param {object} source     The data source being browsed
   */
  #createDirectoryDialog(source) {
    const labelText = game.i18n.localize("FILES.DirectoryName.Label");
    const placeholder = game.i18n.localize("FILES.DirectoryName.Placeholder");
    const content = `<div class="form-group">
    <label for="create-directory-name">${labelText}</label>
    <div class="form-fields">
    <input id="create-directory-name" type="text" name="dirname" placeholder="${foundry.utils.escapeHTML(placeholder)}" required autofocus>
    </div></div>`;
    return foundry.applications.api.DialogV2.confirm({
      id: "create-directory",
      window: {title: "FILES.CreateSubfolder", icon: "fa-solid fa-folder-plus"},
      content,
      yes: {
        label: "CONTROLS.CommonCreate",
        default: true,
        callback: async event => {
          const dirname = event.currentTarget.querySelector("input").value || placeholder;
          const path = [source.target, dirname].filterJoin("/");
          try {
            await this.constructor.createDirectory(this.activeSource, path, {bucket: source.bucket});
          } catch( err ) {
            ui.notifications.error(err.message);
          }
          return this.browse(this.target);
        }
      },
      no: {label: "Cancel"}
    });
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /**
   * Browse to a specific location for this FilePicker instance
   * @param {string} [target]   The target within the currently active source location.
   * @param {object} [options]  Browsing options
   * @returns {Promise<this>}
   */
  async browse(target=this.target, options={}) {

    // If the user does not have permission to browse, do not proceed
    if ( game.user?.can("FILES_BROWSE") === false ) return this;

    // Configure browsing parameters
    options = Object.assign({
      type: this.type,
      extensions: this.extensions,
      wildcard: false,
      render: true
    }, options);

    // Determine the S3 buckets which may be used
    const source = this.activeSource;
    if ( source === "s3" ) {
      if ( this.constructor.S3_BUCKETS === null ) {
        const buckets = await this.constructor.browse("s3", "");
        this.constructor.S3_BUCKETS = buckets.dirs;
      }
      this.sources.s3.buckets = this.constructor.S3_BUCKETS;
      if ( !this.source.bucket ) this.source.bucket = this.constructor.S3_BUCKETS[0];
      options.bucket = this.source.bucket;
    }

    // Avoid browsing certain paths
    const safeTarget = target === CONST.DEFAULT_TOKEN
      ? this.constructor.LAST_BROWSED_DIRECTORY
      : target.replace(/^\//, "");

    // Request files from the server
    const result = await this.constructor.browse(source, safeTarget, options).catch(error => {
      ui.notifications.warn(error);
      return this.constructor.browse(source, "", options);
    });

    // Populate browser content
    this.result = result;
    this.source.target = result.target;
    if ( source === "s3" ) this.source.bucket = result.bucket;
    this.constructor.LAST_BROWSED_DIRECTORY = result.target;
    this.#loaded = true;

    // Render the application
    if ( options.render ) return this.render({force: !this.rendered});
    return this;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async render(...args) {
    if ( game.user?.can("FILES_BROWSE") === false ) return this;
    if ( !this.#loaded ) return this.browse();
    return super.render(...args);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const result = this.result;
    const source = this.source;
    const isS3 = this.activeSource === "s3";

    // Sort directories alphabetically and store their paths
    const dirs = result.dirs.map(d => ({
      name: decodeURIComponent(d.split("/").pop()),
      path: d,
      private: result.private || result.privateDirs.includes(d)
    })).sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));

    // Sort files alphabetically and store their client URLs
    const files = result.files.map(path => {
      let img = path;
      if ( foundry.helpers.media.VideoHelper.hasVideoExtension(path) ) img = "icons/svg/video.svg";
      else if ( foundry.audio.AudioHelper.hasAudioExtension(path) ) img = "icons/svg/sound.svg";
      else if ( !foundry.helpers.media.ImageHelper.hasImageExtension(path) ) img = "icons/svg/book.svg";
      return {
        name: decodeURIComponent(path.split("/").pop()),
        url: path,
        img
      };
    }).sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));

    const canSelect = !this.options.tileSize;
    const buttons = canSelect ? [{
      type: "submit",
      icon: "fa-solid fa-check",
      label: this.type === "folder" ? "FILES.SelectFolder" : "FILES.SelectFile"
    }] : [];
    return Object.assign(context, {
      rootId: this.id,
      bucket: isS3 ? source.bucket : null,
      buckets: isS3 ? source.buckets.map(b => ({ value: b, label: b })) : null,
      canGoBack: this.activeSource !== "",
      canCreateFolder: this.canCreateFolder,
      canUpload: this.canUpload,
      canSelect,
      canTogglePrivacy: game.user?.isGM !== false,
      dirs: dirs,
      displayMode: this.displayMode,
      extensions: this.extensions,
      files,
      isS3: isS3,
      noResults: dirs.length + files.length === 0,
      selected: this.type === "folder" ? source.target : this.request,
      source,
      sources: this.sources,
      target: decodeURIComponent(source.target),
      tileSize: this.options.tileSize ? (this.constructor.LAST_TILE_SIZE || canvas.dimensions.size) : null,
      user: game.user,
      favorites: this.favorites,
      buttons
    });
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _prepareTabs(group) {
    if ( group !== "sources" ) return super._prepareTabs(group);
    this.tabGroups.sources = this.activeSource;
    const tabs = super._prepareTabs(group);
    for ( const source in tabs ) {
      if ( !(source in this.sources) ) delete tabs[source];
    }
    return tabs;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  changeTab(tab, group, options) {
    if ( group === "sources" ) this.tabGroups.sources = this.activeSource = tab;
    this.browse(this.source.target);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _tearDown(options) {
    super._tearDown(options);
    this.#search.unbind();
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    const form = this.element;

    form.classList.toggle("private", this.result.private);

    // Change the directory
    const targetInput = form.elements.target;
    targetInput.addEventListener("keydown", this.#onRequestTarget.bind(this));
    targetInput.focus();

    // Change the S3 bucket
    form.elements.bucket?.addEventListener("change", this.#onChangeBucket.bind(this));

    // Change the tile size.
    form.elements.tileSize?.addEventListener("change", this._onChangeTileSize.bind(this));

    // Upload new file
    if ( this.canUpload ) form.elements.upload?.addEventListener("change", this.#onUpload.bind(this));

    // Flag the current pick
    const li = form.querySelector(`.file[data-path="${encodeURIComponent(this.request)}"]`);
    if ( li ) li.classList.add("picked");

    // Search among shown directories and files
    this.#search.bind(form);

    // Drag & drop
    if ( options.parts.includes("body") ) {
      new foundry.applications.ux.DragDrop.implementation({
        dragSelector: "li[data-file]",
        dropSelector: "section[data-files]",
        permissions: {
          dragstart: () => !!game.user?.isGM && (canvas.activeLayer instanceof foundry.canvas.layers.TilesLayer),
          drop: () => this.canUpload
        },
        callbacks: {
          dragstart: this.#onDragStart.bind(this),
          drop: this.#onDrop.bind(this)
        }
      }).bind(this.element);
    }
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /**
   * Handle a click event to change the display mode of the File Picker
   * @this {FilePicker}
   * @type {ApplicationClickAction}
   */
  static async #onChangeDisplayMode(_event, button) {
    if ( !this.constructor.DISPLAY_MODES.includes(button.dataset.mode) ) {
      throw new Error("Invalid display mode requested");
    }
    if ( button.dataset.mode === this.displayMode ) return;
    this.constructor.LAST_DISPLAY_MODE = this.displayMode = button.dataset.mode;
    for ( const modeButton of button.closest("div").querySelectorAll("button") ) {
      modeButton.ariaPressed = String(modeButton.dataset.mode === this.displayMode);
    }
    await this.render({parts: ["body"]});
  }

  /* -------------------------------------------- */

  /**
   * Traverse back one directory level.
   * @this {FilePicker}
   * @type {ApplicationClickAction}
   */
  static async #onBackTraverse() {
    const path = this.target.replace(/\/$/, "").split("/").slice(0, -1).join("/");
    await this.browse(path);
  }

  /* -------------------------------------------- */

  /**
   * Create a new subdirectory in the current working directory.
   * @this {FilePicker}
   * @type {ApplicationClickAction}
   */
  static async #onMakeDirectory() {
    await this.#createDirectoryDialog(this.source);
  }

  /* -------------------------------------------- */

  /**
   * Toggle privacy mode.
   * @this {FilePicker}
   * @type {ApplicationClickAction}
   */
  static async #onTogglePrivacy() {
    const isPrivate = !this.result.private;
    const data = {private: isPrivate, bucket: this.result.bucket};
    const result = await this.constructor.configurePath(this.activeSource, this.target, data);
    this.result.private = result.private;
    await this.render({parts: ["subheader", "body"]});
  }

  /* -------------------------------------------- */

  /**
   * Navigate to a favorited directory.
   * @this {FilePicker}
   * @type {ApplicationClickAction}
   */
  static async #onGoToFavorite(_event, button) {
    const source = button.dataset.source || this.activeSource;
    this.activeSource = source;
    const path = button.dataset.path || this.target;
    await this.browse(path);
  }

  /* -------------------------------------------- */

  /**
   * Add the given path for the source to the favorites.
   * @this {FilePicker}
   * @type {ApplicationClickAction}
   */
  static async #onSetFavorite(_event, button) {
    const source = button.dataset.source || this.activeSource;

    // Standardize all paths to end with a "/".
    // Has the side benefit of ensuring that the root path which is normally an empty string has content.
    const path = `${button.dataset.path || this.target}/`.replace(/\/+$/, "/");
    const favorites = foundry.utils.deepClone(this.favorites);
    if ( `${source}-${path}` in favorites ) {
      ui.notifications.info("FILES.AlreadyFavorited", {format: {path}});
      return;
    }
    const label = path === "/" ? "root" : path.split("/").at(-2); // Get the final part of the path for the label
    favorites[`${source}-${path}`] = {source, path, label};
    await game.settings.set("core", "favoritePaths", favorites);
    await this.render({parts: ["subheader"]});
  }

  /* -------------------------------------------- */

  /**
   * Remove the given path from the favorites.
   * @this {FilePicker}
   * @type {ApplicationClickAction}
   */
  static async #onRemoveFavorite(_event, button) {
    const source = button.dataset.source || this.activeSource;
    let path = button.dataset.path || this.target;
    path = path.endsWith("/") ? path : `${path}/`;
    const favorites = foundry.utils.deepClone(this.favorites);
    delete favorites[`${source}-${path}`];
    await game.settings.set("core", "favoritePaths", favorites);
    await this.render({parts: ["subheader"]});
  }

  /* -------------------------------------------- */

  /**
   * Handle a directory selection within the file picker
   * @this {FilePicker}
   * @type {ApplicationClickAction}
   */
  static async #onPickDirectory(_event, row) {
    await this.browse(row.dataset.path);
  }

  /* -------------------------------------------- */

  /**
   * Handle file selection within the file picker
   * @this {FilePicker}
   * @type {ApplicationClickAction}
   */
  static async #onPickFile(_event, pickedRow) {
    const form = this.element;
    for ( const row of pickedRow.closest("ul").children ) {
      row.classList.toggle("picked", row === pickedRow);
    }
    if ( form.elements.file ) form.elements.file.value = pickedRow.dataset.path;
  }

  /* -------------------------------------------- */

  /**
   * Handle user submission of the address bar to request an explicit target
   * @param {KeyboardEvent} event     The originating keydown event
   */
  async #onRequestTarget(event) {
    if ( event.key === "Enter" ) {
      event.preventDefault();
      await this.browse(event.target.value);
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle the start of a drag.
   * @param {DragEvent} event
   */
  #onDragStart(event) {
    const li = event.currentTarget;

    // Get the tile size ratio
    const tileSize = parseInt(li.closest("form").tileSize.value) || canvas.dimensions.size;
    const ratio = canvas.dimensions.size / tileSize;

    // Set drag data
    const dragData = {
      type: "Tile",
      texture: {src: li.dataset.path},
      fromFilePicker: true,
      tileSize
    };
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));

    // Create the drag preview for the image
    const img = li.querySelector("img");
    const w = img.naturalWidth * ratio * canvas.stage.scale.x;
    const h = img.naturalHeight * ratio * canvas.stage.scale.y;
    const preview = foundry.applications.ux.DragDrop.implementation.createDragImage(img, w, h);
    event.dataTransfer.setDragImage(preview, w/2, h/2);
  }

  /* -------------------------------------------- */

  /**
   * Handle a drop event.
   * @param {DragEvent} event
   */
  async #onDrop(event) {
    if ( !this.canUpload ) return;
    const form = this.element;
    form.disabled = true;
    const target = form.target.value;

    // Process the data transfer
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    const files = event.dataTransfer.files;
    if ( !files?.length || data.fromFilePicker ) return;

    // Iterate over dropped files
    for ( const upload of files ) {
      const name = upload.name.toLowerCase();
      try {
        this.#validateExtension(name);
      } catch(err) {
        ui.notifications.error(err, {console: true});
        continue;
      }
      const response = await this.constructor.upload(this.activeSource, target, upload, {
        bucket: form.bucket ? form.bucket.value : null
      });
      if ( response ) this.request = response.path;
    }

    // Re-enable the form
    form.disabled = false;
    await this.browse(target);
  }

  /* -------------------------------------------- */

  /**
   * Handle changes to the bucket selector
   * @param {Event} event     The S3 bucket select change event
   */
  #onChangeBucket(event) {
    event.preventDefault();
    const select = event.currentTarget;
    this.sources.s3.bucket = select.value;
    return this.browse("/");
  }

  /* -------------------------------------------- */

  /**
   * Handle changes to the tile size.
   * @param {Event} event  The triggering event.
   * @protected
   */
  _onChangeTileSize(event) {
    this.constructor.LAST_TILE_SIZE = event.currentTarget.valueAsNumber;
  }

  /* -------------------------------------------- */

  /**
   * Search among shown directories and files.
   * @param {KeyboardEvent} event The triggering event
   * @param {string} query The search input value
   * @param {RegExp} rgx
   * @param {HTMLElement} html
   * @protected
   */
  _onSearchFilter(event, query, rgx, html) {
    for ( const list of html.querySelectorAll("ul") ) {
      let matched = false;
      for ( const row of list.children ) {
        const match = foundry.applications.ux.SearchFilter.testQuery(rgx, row.dataset.name);
        if ( match ) matched = true;
        row.style.display = !match ? "none" : "";
      }
      list.style.display = matched ? "" : "none";
    }
    this.setPosition({height: "auto"});
  }

  /* -------------------------------------------- */

  /**
   * Handle file selection.
   * @this {FilePicker}
   * @type {ApplicationFormSubmission}
   */
  static async #onSubmit(event) {
    if ( this.options.tileSize ) return;
    const path = event.target.file?.value;
    if ( !path ) {
      ui.notifications.error("You must select a file to proceed.");
      return;
    }

    // Update the target field
    if ( this.field ) {
      this.field.value = path;
      this.field.dispatchEvent(new Event("change", {bubbles: true, cancelable: true}));
    }

    // Trigger a callback and close
    if ( this.callback ) this.callback(path, this);
    await this.close();
  }

  /* -------------------------------------------- */

  /**
   * Handle file upload
   * @param {Event} event The file upload event
   */
  async #onUpload(event) {
    const form = event.target.form;
    const upload = form.upload.files[0];
    const name = upload.name.toLowerCase();

    // Validate file extension
    try {
      this.#validateExtension(name);
    } catch(err) {
      ui.notifications.error(err, {console: true});
      return false;
    }

    // Dispatch the request
    const target = form.target.value;
    const options = { bucket: form.bucket ? form.bucket.value : null };
    const response = await this.constructor.upload(this.activeSource, target, upload, options);

    // Handle errors
    if ( response.error ) {
      return ui.notifications.error(response.error);
    }

    // Flag the uploaded file as the new request
    this.request = response.path;
    return this.browse(target);
  }

  /* -------------------------------------------- */
  /*  Factory Methods                             */
  /* -------------------------------------------- */

  /**
   * Bind the file picker to a new target field.
   * Assumes the user will provide a HTMLButtonElement which has the data-target and data-type attributes
   * The data-target attribute should provide the name of the input field which should receive the selected file
   * The data-type attribute is a string in ["image", "audio"] which sets the file extensions which will be accepted
   *
   * @param {HTMLButtonElement} button     The button element
   */
  static fromButton(button) {
    if ( !(button instanceof HTMLButtonElement ) ) throw new Error("You must pass an HTML button");
    const type = button.getAttribute("data-type");
    const form = button.form;
    const field = form[button.dataset.target] || null;
    const current = field?.value || "";
    return new FilePicker.implementation({field, type, current, button});
  }
}