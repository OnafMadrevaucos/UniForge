export class Database { // !!!Database Temporária!!! 
        static calendars = {
        ayruida: {
            label: 'Ayruídico',
            months: ['Ionária', 'Hilmíria', 'Magníria', 'Ebrill', 'Baeldúria', 'Morigúria', 'Tydoníria', 'Truvadíria'],
            days: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
            daysInMonth: [45, 45, 45, 45, 45, 45, 45, 45]
        },
        druida: {
            label: 'Druídico',
            months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
            days: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
            daysInMonth: [45, 45, 45, 45, 45, 45, 45, 45]
        }
    };
    static subjectTypes = {
        BIO: {
            sid: 'BIO',
            root: 'nature',
            title: 'Biológico',
            icon: 'fas fa-dna',
            entries: [],
            deleted: false
        },
        EVN: {
            sid: 'EVN',
            root: 'history',
            title: 'Eventos',
            icon: 'fas fa-newspaper',
            entries: [],
            deleted: false
        },
        BTL: {
            sid: 'BTL',
            root: 'history',
            title: 'Batalhas',
            icon: 'fas fa-people-roof',
            entries: [],
            deleted: false
        },
        CON: {
            sid: 'CON',
            root: 'history',
            title: 'Construções',
            icon: 'fas fa-landmark-dome',
            entries: [],
            deleted: false
        },
        COS: {
            sid: 'COS',
            root: 'nature',
            title: 'Cósmicos',
            icon: 'fas fa-meteor',
            entries: [],
            deleted: false
        },
        CFL: {
            sid: 'CFL',
            root: 'history',
            title: 'Conflitos',
            icon: 'fas fa-hand-fist',
            entries: [],
            deleted: false
        },
        COQ: {
            sid: 'COQ',
            root: 'history',
            title: 'Conquistas',
            icon: 'fa-brands fa-font-awesome',
            entries: [],
            deleted: false
        },
        DOG: {
            sid: 'DOG',
            root: 'religion',
            title: 'Dogmas',
            icon: 'fas fa-scroll',
            entries: [],
            deleted: false
        },
        FAU: {
            sid: 'FAU',
            root: 'nature',
            title: 'Fauna',
            icon: 'fas fa-paw',
            entries: [],
            deleted: false
        },
        FCT: {
            sid: 'FCT',
            root: 'politics',
            title: 'Facções',
            icon: 'fas fa-people-roof',
            entries: [],
            deleted: false
        },
        FEN: {
            sid: 'FEN',
            root: 'nature',
            title: 'Fenômenos Naturais',
            icon: 'fas fa-cloud-sun',
            entries: [],
            deleted: false
        },
        FLO: {
            sid: 'FLO',
            root: 'nature',
            title: 'Floras',
            icon: 'fas fa-leaf',
            entries: [],
            deleted: false
        },
        IDE: {
            sid: 'IDE',
            root: 'politics',
            title: 'Ideologias',
            icon: 'fas fa-lightbulb',
            entries: [],
            deleted: false
        },
        KGD: {
            sid: 'KGD',
            root: 'politics',
            title: 'Reinos',
            icon: 'fas fa-chess-rook',
            entries: [],
            deleted: false
        },
        RUL: {
            sid: 'RUL',
            root: 'politics',
            title: 'Governos',
            icon: 'fas fa-landmark-flag',
            entries: [],
            deleted: false
        }
    }
    static entryTypes = {
        gen: {
            label: 'Artigo Genérico',
            icon: 'fas fa-newspaper'
        },
        boa: {
            label: 'Boato',
            icon: 'fas fa-comments'
        },
        des: {
            label: 'Descoberta',
            icon: 'fas fa-book-open-reader'
        },
        doc: {
            label: 'Documento',
            icon: 'fas fa-file'
        },
        per: {
            label: 'Pessoa',
            icon: 'fas fa-user-large'
        },
        rel: {
            label: 'Relato',
            icon: 'fas fa-message'
        }
    };
    static years = {};
    static entries = {};

    static newEntry(entryId, title) {
        const entry = {
            entryId: entryId,
            importance: '',
            date: {
                y: '',
                m: '',
                d: ''
            },
            title: title,
            type: '',
            flavor: '',
            icon: '',
            text: '',
            htmlString: '',
            isDraft: false,
            deleted: false
        };
        Database.entries[entryId] = entry;
        return entry;
    }

    static addEntryToSubject(id, type){
        Database.subjectTypes[id].entries.push({entryId: type.entryId, deleted: false});
    }
    static addEntryToFolder(id, entry){
        Database.categories[id].entries.push({entryId: entry.entryId, deleted: false});
    }

    static models = {
        entry: {
            entryId: '',
            importance: '',
            date: {
                y: '',
                m: '',
                d: ''
            },
            title: '',
            type: '',
            flavor: '',
            icon: '',
            text: '',
            htmlString: '',
            isDraft: false
        },
        timeline: {
            timelineId: '',
            title: '',
            entries: []
        }
    }
    static categories = {
        CL: {
            cid: 'CL',
            root: 'history',
            title: 'Conflitos',
            entries: [
                {
                    entryId: 'CL001',
                    deleted: false
                }
            ],
            deleted: false
        },
        FN: {
            cid: 'FN',
            root: 'encyclo',
            title: 'Fenômeno Natural',
            entries: [
                {
                    entryId: 'FN002',
                    deleted: false
                }
            ],
            deleted: false
        },
        CO: {
            cid: 'CO',
            root: 'encyclo',
            title: 'Conhecimento',
            entries: [],
            deleted: false
        },
        LC: {
            cid: 'LC',
            root: 'encyclo',
            title: 'Locais',
            entries: [],
            deleted: false
        },
        PL: {
            cid: 'PL',
            root: 'encyclo',
            title: 'Plantas',
            entries: [
                {
                    entryId: 'PL001',
                    deleted: false
                },
                {
                    entryId: 'PL003',
                    deleted: false
                }
            ],
            deleted: false
        },
        RG: {
            cid: 'RG',
            root: 'atlas',
            title: 'Região',
            entries: [],
            deleted: false
        }
    };
    static entries = {
        CL001: {
            entryId: 'CL001',
            title: 'Lorem Ipsum',
            flavor: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec accumsan tellus, a porta odio. Duis et rhoncus dui, sit amet facilisis magna.',
            icon: '<i class="fas fa-comments"></i>',
            htmlString: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nec accumsan tellus, a porta odio. Duis et rhoncus dui, sit amet facilisis magna. </p>' +
                '<h1>Donec</h1>' +
                '<p>Eu massa sodales libero blandit commodo eu eget sapien. Nulla <span class="linked-text" data-entry-id="FN002">facilisi</span>. Donec neque justo, finibus eu velit sed, suscipit molestie lectus. Suspendisse posuere mi ac nulla vulputate, vitae imperdiet neque sodales. Cras venenatis porta lacus eget porttitor.</p>' +
                '<blockquote>' +
                '<p>In aliquam enim quis mauris porta sollicitudin. Aliquam quam lectus, efficitur sed urna non, cursus pretium ante. Nam in nisi sem. Fusce aliquet nibh odio, sit amet viverra turpis porta sit amet. Donec malesuada tortor eget tincidunt vulputate. Vestibulum lacinia malesuada nunc suscipit sollicitudin. Sed mattis massa id sodales accumsan. Donec id nunc a arcu viverra maximus.</p>' +
                '</blockquote>' +
                '<p>Proin et nulla egestas, fermentum diam sed, euismod leo. Phasellus vel pretium augue. Fusce lacus sapien, pharetra a metus ac, ultrices maximus magna. Duis lacinia feugiat velit quis faucibus. Ut ac nunc quis augue maximus auctor ac quis felis. Nam nec rhoncus ex. Quisque in nunc ut purus elementum iaculis vitae aliquet enim. Duis sed erat non orci finibus lacinia sagittis et dui. Quisque pharetra quam nisl, sed ultrices lorem tempor et. Etiam elit augue, eleifend id purus eget, condimentum convallis quam. <span class="linked-text" data-entry-id="PL001">Fusc</span>e ligula velit, aliquam nec nibh et, auctor vehicula lacus. Mauris cursus semper bibendum. Duis faucibus ultricies purus, nec venenatis enim. Curabitur porttitor lorem non urna ultricies, quis bibendum tellus hendrerit.</p>' +
                '<h2>Praesent quis</h2>' +
                '<p>Neque ac ipsum consectetur tincidunt. Sed quis tristique nisi, quis vestibulum libero. Pellentesque finibus fermentum enim, eu luctus libero mattis vitae. Nunc sit amet pretium est. Suspendisse porta, lorem a consequat convallis, turpis urna consectetur tellus, id gravida magna neque in enim. Donec vel porttitor neque. Ut leo enim, suscipit eu tempus quis, cursus non nisl. Aenean a enim non dolor varius tincidunt. Integer vitae ipsum lorem. Praesent vestibulum suscipit orci, eu vehicula neque dapibus et. Vestibulum volutpat cursus magna, vel aliquam lorem vestibulum in.</p>' +
                '<h2>Vestibulum </h2>' +
                '<p>Ultricies enim ut sodales lacinia. Suspendisse potenti. Praesent tincidunt elementum fringilla. Vestibulum ac consectetur leo, at lobortis nisl. Donec vel leo ac sem egestas ultricies. Mauris interdum sapien ac ante tristique, eget cursus ipsum varius. Phasellus dapibus, ex sit amet venenatis vulputate, dolor quam interdum odio, a tempus velit sem luctus magna. Morbi pharetra nunc tempus leo hendrerit, at eleifend erat tincidunt. Vivamus ac dapibus sapien, quis egestas lacus. Cras scelerisque magna et velit interdum accumsan quis sit amet justo. Etiam elementum, libero sit amet convallis ornare, magna dui fermentum quam, eu lobortis massa sapien id ex. Praesent sed leo efficitur metus sodales tincidunt at eu odio.</p>' +
                '<p>Fusce eu leo vulputate, blandit mauris sed, luctus magna. Aliquam eget magna purus. Etiam tincidunt, dui vitae suscipit consequat, lacus nisl tincidunt justo, eu commodo dolor turpis eget ligula. Nulla ut fringilla magna. In hac habitasse platea dictumst. Sed viverra tincidunt dui, ut placerat leo tristique ac. Phasellus non elit id nunc egestas cursus. In pharetra finibus massa ut dapibus. Mauris id pellentesque ex. Duis non tristique tortor.</p>' +
                '<h1>Proin</h1>' +
                '<p>Consequat mauris aliquet lorem aliquet, in finibus elit egestas. Vestibulum leo nisl, sagittis at feugiat in, egestas a nisl. Praesent sed placerat diam. Integer et tristique nunc. Maecenas auctor cursus turpis id ornare. Mauris bibendum interdum diam, at aliquet leo vehicula eget. Vestibulum vitae bibendum tortor. Etiam vel tortor a orci rhoncus hendrerit id eget lectus. Vestibulum eget nunc id felis dapibus lobortis quis quis mauris.</p>' +
                '<p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin justo magna, molestie scelerisque lorem non, imperdiet condimentum tellus. Nam eget mollis lacus. Fusce et ultrices orci, non interdum elit. Donec sit amet nibh nibh. Donec lacinia convallis massa, ac dapibus purus. Nulla facilisi.</p>' +
                '<p>Vivamus viverra dui lorem, sit amet tincidunt neque lobortis quis. Donec at nunc at felis tristique porttitor cursus vel dolor. Quisque fermentum et tortor quis placerat. Nullam et dolor nec mauris viverra eleifend. Vestibulum semper eleifend odio, eu aliquam ante egestas eu. Fusce non metus scelerisque, congue quam a, viverra velit. Fusce feugiat eget lacus non lacinia. Nunc eu rhoncus neque. Cras non urna sapien. Mauris sodales dignissim nisl, eu mollis elit luctus eget. Sed non imperdiet augue.</p>' +
                '<p>Quisque posuere, libero nec sagittis ultricies, magna ipsum congue lectus, sit amet accumsan nulla nisl non orci. Curabitur neque ex, ultrices sit amet tempor id, iaculis a odio. Mauris rutrum non neque id viverra. Praesent tempor dolor auctor, blandit mi eu, aliquam ex. Suspendisse sodales nisi elit, non lobortis odio suscipit non. In luctus nec erat nec faucibus. Cras pharetra orci ac ligula consequat rhoncus. Morbi fermentum mauris et sagittis commodo. Sed quis euismod massa, nec hendrerit mi. Donec a odio lorem. Suspendisse libero nisl, tristique vitae blandit sit amet, auctor eu turpis. Morbi at mauris gravida mauris consectetur feugiat. Duis egestas odio quis augue rhoncus consequat.</p>',
            isDraft: false,
            deleted: false

        },
        FN002: {
            entryId: 'FN002',
            title: 'Ut Enim',
            flavor: 'Sed congue nisi id libero semper, molestie posuere lacus pellentesque. Praesent vulputate tristique nulla. Quisque at pulvinar magna.',
            icon: '<i class="fas fa-cloud-sun"></i>',
            htmlString: '<p>Sed congue nisi id libero semper, molestie posuere lacus pellentesque. Praesent vulputate tristique nulla. Quisque at pulvinar magna. </p>' +
                '<h1>Donec</h1>' +
                '<p>Eu massa sodales libero blandit commodo eu eget sapien. Nulla <span class="linked-text" data-entry-id="PL003">facilisi</span>. Donec neque justo, finibus eu velit sed, suscipit molestie lectus. Suspendisse posuere mi ac nulla vulputate, vitae imperdiet neque sodales. Cras venenatis porta lacus eget porttitor.</p>' +
                '<div class="img-wrapper flexcol">' +
                '<img src="./images/teste_img.jpg"/>' +
                '<span class="img-caption">Imagem 1 - Teste de Imagem</span>' +
                '</div>' +
                '<p>Proin et nulla egestas, fermentum diam sed, euismod leo. Phasellus vel pretium augue. Fusce lacus sapien, pharetra a metus ac, ultrices maximus magna. Duis lacinia feugiat velit quis faucibus. Ut ac nunc quis augue maximus auctor ac quis felis. Nam nec rhoncus ex. Quisque in nunc ut purus elementum iaculis vitae aliquet enim. Duis sed erat non orci finibus lacinia sagittis et dui. Quisque pharetra quam nisl, sed ultrices lorem tempor et. Etiam elit augue, eleifend id purus eget, condimentum convallis quam. <span class="linked-text" data-entry-id="CL001">Fusc</span>e ligula velit, aliquam nec nibh et, auctor vehicula lacus. Mauris cursus semper bibendum. Duis faucibus ultricies purus, nec venenatis enim. Curabitur porttitor lorem non urna ultricies, quis bibendum tellus hendrerit.</p>' +
                '<h2>Praesent quis</h2>' +
                '<p>Neque ac ipsum consectetur tincidunt. Sed quis tristique nisi, quis vestibulum libero. Pellentesque finibus fermentum enim, eu luctus libero mattis vitae. Nunc sit amet pretium est. Suspendisse porta, lorem a consequat convallis, turpis urna consectetur tellus, id gravida magna neque in enim. Donec vel porttitor neque. Ut leo enim, suscipit eu tempus quis, cursus non nisl. Aenean a enim non dolor varius tincidunt. Integer vitae ipsum lorem. Praesent vestibulum suscipit orci, eu vehicula neque dapibus et. Vestibulum volutpat cursus magna, vel aliquam lorem vestibulum in.</p>' +
                '<h2>Vestibulum </h2>' +
                '<p>Ultricies enim ut sodales lacinia. Suspendisse potenti. Praesent tincidunt elementum fringilla. Vestibulum ac consectetur leo, at lobortis nisl. Donec vel leo ac sem egestas ultricies. Mauris interdum sapien ac ante tristique, eget cursus ipsum varius. Phasellus dapibus, ex sit amet venenatis vulputate, dolor quam interdum odio, a tempus velit sem luctus magna. Morbi pharetra nunc tempus leo hendrerit, at eleifend erat tincidunt. Vivamus ac dapibus sapien, quis egestas lacus. Cras scelerisque magna et velit interdum accumsan quis sit amet justo. Etiam elementum, libero sit amet convallis ornare, magna dui fermentum quam, eu lobortis massa sapien id ex. Praesent sed leo efficitur metus sodales tincidunt at eu odio.</p>' +
                '<p>Fusce eu leo vulputate, blandit mauris sed, luctus magna. Aliquam eget magna purus. Etiam tincidunt, dui vitae suscipit consequat, lacus nisl tincidunt justo, eu commodo dolor turpis eget ligula. Nulla ut fringilla magna. In hac habitasse platea dictumst. Sed viverra tincidunt dui, ut placerat leo tristique ac. Phasellus non elit id nunc egestas cursus. In pharetra finibus massa ut dapibus. Mauris id pellentesque ex. Duis non tristique tortor.</p>' +
                '<h1>Proin</h1>' +
                '<p>Consequat mauris aliquet lorem aliquet, in finibus elit egestas. Vestibulum leo nisl, sagittis at feugiat in, egestas a nisl. Praesent sed placerat diam. Integer et tristique nunc. Maecenas auctor cursus turpis id ornare. Mauris bibendum interdum diam, at aliquet leo vehicula eget. Vestibulum vitae bibendum tortor. Etiam vel tortor a orci rhoncus hendrerit id eget lectus. Vestibulum eget nunc id felis dapibus lobortis quis quis mauris.</p>' +
                '<p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin justo magna, molestie scelerisque lorem non, imperdiet condimentum tellus. Nam eget mollis lacus. Fusce et ultrices orci, non interdum elit. Donec sit amet nibh nibh. Donec lacinia convallis massa, ac dapibus purus. Nulla facilisi.</p>' +
                '<p>Vivamus viverra dui lorem, sit amet tincidunt neque lobortis quis. Donec at nunc at felis tristique porttitor cursus vel dolor. Quisque fermentum et tortor quis placerat. Nullam et dolor nec mauris viverra eleifend. Vestibulum semper eleifend odio, eu aliquam ante egestas eu. Fusce non metus scelerisque, congue quam a, viverra velit. Fusce feugiat eget lacus non lacinia. Nunc eu rhoncus neque. Cras non urna sapien. Mauris sodales dignissim nisl, eu mollis elit luctus eget. Sed non imperdiet augue.</p>' +
                '<p>Quisque posuere, libero nec sagittis ultricies, magna ipsum congue lectus, sit amet accumsan nulla nisl non orci. Curabitur neque ex, ultrices sit amet tempor id, iaculis a odio. Mauris rutrum non neque id viverra. Praesent tempor dolor auctor, blandit mi eu, aliquam ex. Suspendisse sodales nisi elit, non lobortis odio suscipit non. In luctus nec erat nec faucibus. Cras pharetra orci ac ligula consequat rhoncus. Morbi fermentum mauris et sagittis commodo. Sed quis euismod massa, nec hendrerit mi. Donec a odio lorem. Suspendisse libero nisl, tristique vitae blandit sit amet, auctor eu turpis. Morbi at mauris gravida mauris consectetur feugiat. Duis egestas odio quis augue rhoncus consequat.</p>',
            isDraft: false,
            deleted: false
        },
        PL001: {
            entryId: 'PL001',
            title: 'Expedita Distinctio',
            flavor: 'Nullam vulputate turpis ut commodo ullamcorper. Sed imperdiet enim ac sodales fringilla. Vivamus ut auctor dolor, eget pharetra arcu.',
            icon: '<i class="fas fa-hand-fist"></i>',
            htmlString: '<p>Nullam vulputate turpis ut commodo ullamcorper. Sed imperdiet enim ac sodales fringilla. Vivamus ut auctor dolor, eget pharetra arcu. </p>' +
                '<h1>Donec</h1>' +
                '<p>Eu massa sodales libero blandit commodo eu eget sapien. Nulla <span class="linked-text" data-entry-id="PL001">facilisi</span>. Donec neque justo, finibus eu velit sed, suscipit molestie lectus. Suspendisse posuere mi ac nulla vulputate, vitae imperdiet neque sodales. Cras venenatis porta lacus eget porttitor.</p>' +
                '<blockquote>' +
                '<p>Ut vitae est sollicitudin, sollicitudin orci vitae, vehicula odio. Nullam vitae pulvinar mi. Mauris vel lorem vitae turpis egestas dictum. Curabitur laoreet dignissim pulvinar. Sed eget nibh ipsum. Pellentesque at quam gravida, vehicula risus ut, faucibus arcu. Aliquam mollis ligula lorem, vel accumsan metus imperdiet vitae. Fusce metus sem, porttitor quis libero sed, accumsan elementum nibh. Donec non nisi metus. Duis ut malesuada arcu. Ut eget efficitur tortor, non dignissim ipsum. Aenean feugiat, lorem quis imperdiet mattis, urna est hendrerit lacus, vitae aliquam libero enim vitae tellus. Integer finibus vitae nibh vel faucibus.</p>' +
                '</blockquote>' +
                '<blockquote>' +
                '<p>Maecenas placerat sem aliquam augue lacinia imperdiet. Sed sit amet nisl tortor. Nam nisi purus, dictum sit amet ex facilisis, iaculis efficitur orci. Aliquam quis leo a dui bibendum ullamcorper. Sed eu sagittis velit. Donec non eleifend felis, sed porttitor tellus. Etiam vitae mi eget tellus dictum molestie. Mauris ornare est ac sapien faucibus maximus. Vestibulum fermentum tortor sapien, tincidunt scelerisque ipsum luctus quis. Curabitur ultricies vel sem non sagittis. Etiam tincidunt auctor ullamcorper. Morbi quis finibus purus, sed aliquet ipsum. Phasellus feugiat magna euismod magna condimentum, vitae elementum neque ullamcorper.</p>' +
                '</blockquote>' +
                '<blockquote>' +
                '<p>Ut vitae est sollicitudin, sollicitudin orci vitae, vehicula odio. Nullam vitae pulvinar mi. Mauris vel lorem vitae turpis egestas dictum. Curabitur laoreet dignissim pulvinar. Sed eget nibh ipsum. Pellentesque at quam gravida, vehicula risus ut, faucibus arcu. Aliquam mollis ligula lorem, vel accumsan metus imperdiet vitae. Fusce metus sem, porttitor quis libero sed, accumsan elementum nibh. Donec non nisi metus. Duis ut malesuada arcu. Ut eget efficitur tortor, non dignissim ipsum. Aenean feugiat, lorem quis imperdiet mattis, urna est hendrerit lacus, vitae aliquam libero enim vitae tellus. Integer finibus vitae nibh vel faucibus.</p>' +
                '</blockquote>' +
                '<p>In lacus sem, varius ut lorem quis, <span class="linked-text" data-entry-id="FN002">feugiat</span> viverra sem. Integer rutrum elit eget justo tempus, quis efficitur odio luctus. Fusce risus eros, ullamcorper et rutrum quis, tristique at metus. Aliquam lacinia orci viverra eros aliquam, at rhoncus dolor blandit. Aliquam nisi sem, cursus quis augue vitae, mattis cursus lectus. Quisque a hendrerit nunc. Maecenas varius vulputate vestibulum.</p>' +
                '<blockquote>' +
                '<p>Donec vitae vestibulum orci. Ut et eleifend velit. Suspendisse gravida massa vel nibh finibus, in pulvinar eros vulputate. Quisque ornare facilisis pulvinar. Donec in libero nec odio porta suscipit. Suspendisse convallis sapien diam, sit amet placerat ipsum maximus in. Aliquam luctus bibendum lorem, sed porttitor elit elementum in. Nunc faucibus mollis erat, a ullamcorper odio commodo quis. Fusce ultrices urna quis ante accumsan venenatis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Etiam tristique facilisis tempor. Mauris fermentum elementum semper. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Etiam viverra mauris sit amet dolor consectetur, molestie mattis sapien blandit.</p>' +
                '</blockquote>' +
                '<blockquote>' +
                '<p>Ut vitae est sollicitudin, sollicitudin orci vitae, vehicula odio. Nullam vitae pulvinar mi. Mauris vel lorem vitae turpis egestas dictum. Curabitur laoreet dignissim pulvinar. Sed eget nibh ipsum. Pellentesque at quam gravida, vehicula risus ut, faucibus arcu. Aliquam mollis ligula lorem, vel accumsan metus imperdiet vitae. Fusce metus sem, porttitor quis libero sed, accumsan elementum nibh. Donec non nisi metus. Duis ut malesuada arcu. Ut eget efficitur tortor, non dignissim ipsum. Aenean feugiat, lorem quis imperdiet mattis, urna est hendrerit lacus, vitae aliquam libero enim vitae tellus. Integer finibus vitae nibh vel faucibus.</p>' +
                '</blockquote>' +
                '<p>Vivamus viverra dui lorem, sit amet tincidunt neque lobortis quis. Donec at nunc at felis tristique porttitor cursus vel dolor. Quisque fermentum et tortor quis placerat. Nullam et dolor nec mauris viverra eleifend. Vestibulum semper eleifend odio, eu aliquam ante egestas eu. Fusce non metus scelerisque, congue quam a, viverra velit. Fusce feugiat eget lacus non lacinia. Nunc eu rhoncus neque. Cras non urna sapien. Mauris sodales dignissim nisl, eu mollis elit luctus eget. Sed non imperdiet augue.</p>' +
                '<p>Quisque posuere, libero nec sagittis ultricies, magna ipsum congue lectus, sit amet accumsan nulla nisl non orci. Curabitur neque ex, ultrices sit amet tempor id, iaculis a odio. Mauris rutrum non neque id viverra. Praesent tempor dolor auctor, blandit mi eu, aliquam ex. Suspendisse sodales nisi elit, non lobortis odio suscipit non. In luctus nec erat nec faucibus. Cras pharetra orci ac ligula consequat rhoncus. Morbi fermentum mauris et sagittis commodo. Sed quis euismod massa, nec hendrerit mi. Donec a odio lorem. Suspendisse libero nisl, tristique vitae blandit sit amet, auctor eu turpis. Morbi at mauris gravida mauris consectetur feugiat. Duis egestas odio quis augue rhoncus consequat.</p>',
            isDraft: false,
            deleted: false
        },
        PL003: {
            entryId: 'PL003',
            title: 'Consectetur Adipiscing',
            flavor: 'Curabitur eget dui facilisis, aliquam ipsum fringilla, consectetur ex. Integer consectetur metus eu porttitor ultricies.',
            icon: '<i class="fa-brands fa-font-awesome"></i>',
            htmlString: '<p>Curabitur eget dui facilisis, aliquam ipsum fringilla, consectetur ex. Integer consectetur metus eu porttitor ultricies. </p>' +
                '<h1>Donec</h1>' +
                '<p>Eu massa sodales libero blandit commodo eu eget sapien. Nulla <span class="linked-text" data-entry-id="PL001">facilisi</span>. Donec neque justo, finibus eu velit sed, suscipit molestie lectus. Suspendisse posuere mi ac nulla vulputate, vitae imperdiet neque sodales. Cras venenatis porta lacus eget porttitor.</p>' +
                '<blockquote>' +
                '<p>In aliquam enim quis mauris porta sollicitudin. Aliquam quam lectus, efficitur sed urna non, cursus pretium ante. Nam in nisi sem. Fusce aliquet nibh odio, sit amet viverra turpis porta sit amet. Donec malesuada tortor eget tincidunt vulputate. Vestibulum lacinia malesuada nunc suscipit sollicitudin. Sed mattis massa id sodales accumsan. Donec id nunc a arcu viverra maximus.</p>' +
                '</blockquote>' +
                '<div class="img-wrapper flexcol">' +
                '<img src="./images/teste_img.jpg"/>' +
                '<span class="img-caption">Imagem 1 - Teste de Imagem</span>' +
                '</div>' +
                '<p>Proin et nulla egestas, fermentum diam sed, euismod leo. Phasellus vel pretium augue. Fusce lacus sapien, pharetra a metus ac, ultrices maximus magna. Duis lacinia feugiat velit quis faucibus. Ut ac nunc quis augue maximus auctor ac quis felis. Nam nec rhoncus ex. Quisque in nunc ut purus elementum iaculis vitae aliquet enim. Duis sed erat non orci finibus lacinia sagittis et dui. Quisque pharetra quam nisl, sed ultrices lorem tempor et. Etiam elit augue, eleifend id purus eget, condimentum convallis quam. <span class="linked-text" data-entry-id="CL001">Fusc</span>e ligula velit, aliquam nec nibh et, auctor vehicula lacus. Mauris cursus semper bibendum. Duis faucibus ultricies purus, nec venenatis enim. Curabitur porttitor lorem non urna ultricies, quis bibendum tellus hendrerit.</p>' +
                '<h2>Praesent quis</h2>' +
                '<p>Neque ac ipsum consectetur tincidunt. Sed quis tristique nisi, quis vestibulum libero. Pellentesque finibus fermentum enim, eu luctus libero mattis vitae. Nunc sit amet pretium est. Suspendisse porta, lorem a consequat convallis, turpis urna consectetur tellus, id gravida magna neque in enim. Donec vel porttitor neque. Ut leo enim, suscipit eu tempus quis, cursus non nisl. Aenean a enim non dolor varius tincidunt. Integer vitae ipsum lorem. Praesent vestibulum suscipit orci, eu vehicula neque dapibus et. Vestibulum volutpat cursus magna, vel aliquam lorem vestibulum in.</p>' +
                '<h2>Vestibulum </h2>' +
                '<p>Ultricies enim ut sodales lacinia. Suspendisse potenti. Praesent tincidunt elementum fringilla. Vestibulum ac consectetur leo, at lobortis nisl. Donec vel leo ac sem egestas ultricies. Mauris interdum sapien ac ante tristique, eget cursus ipsum varius. Phasellus dapibus, ex sit amet venenatis vulputate, dolor quam interdum odio, a tempus velit sem luctus magna. Morbi pharetra nunc tempus leo hendrerit, at eleifend erat tincidunt. Vivamus ac dapibus sapien, quis egestas lacus. Cras scelerisque magna et velit interdum accumsan quis sit amet justo. Etiam elementum, libero sit amet convallis ornare, magna dui fermentum quam, eu lobortis massa sapien id ex. Praesent sed leo efficitur metus sodales tincidunt at eu odio.</p>' +
                '<p>Fusce eu leo vulputate, blandit mauris sed, luctus magna. Aliquam eget magna purus. Etiam tincidunt, dui vitae suscipit consequat, lacus nisl tincidunt justo, eu commodo dolor turpis eget ligula. Nulla ut fringilla magna. In hac habitasse platea dictumst. Sed viverra tincidunt dui, ut placerat leo tristique ac. Phasellus non elit id nunc egestas cursus. In pharetra finibus massa ut dapibus. Mauris id pellentesque ex. Duis non tristique tortor.</p>' +
                '<h1>Proin</h1>' +
                '<p>Consequat mauris aliquet lorem aliquet, in finibus elit egestas. Vestibulum leo nisl, sagittis at feugiat in, egestas a nisl. Praesent sed placerat diam. Integer et tristique nunc. Maecenas auctor cursus turpis id ornare. Mauris bibendum interdum diam, at aliquet leo vehicula eget. Vestibulum vitae bibendum tortor. Etiam vel tortor a orci rhoncus hendrerit id eget lectus. Vestibulum eget nunc id felis dapibus lobortis quis quis mauris.</p>' +
                '<p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin justo magna, molestie scelerisque lorem non, imperdiet condimentum tellus. Nam eget mollis lacus. Fusce et ultrices orci, non interdum elit. Donec sit amet nibh nibh. Donec lacinia convallis massa, ac dapibus purus. Nulla facilisi.</p>' +
                '<blockquote>' +
                '<p>Nulla est neque, accumsan nec malesuada eu, bibendum id massa. Vestibulum fringilla, urna et condimentum laoreet, urna urna accumsan erat, ac dictum massa orci hendrerit tellus. Curabitur sollicitudin ex id arcu interdum, non vehicula dolor porttitor. Nunc nisl diam, tincidunt sed tempus malesuada, vehicula in mi. Suspendisse ac bibendum quam. Cras fermentum ornare dui, in consequat ex aliquet id. Praesent dapibus justo non pretium scelerisque. Sed facilisis ex vitae pellentesque vulputate. Cras quam nunc, rutrum in venenatis tempor, aliquet eu eros. Donec ac est semper, efficitur erat et, consectetur lacus. Vivamus vel pulvinar risus, ac viverra nulla. Proin id maximus elit, dapibus semper risus.</p>' +
                '</blockquote>' +
                '<blockquote>' +
                '<p>Ut vitae est sollicitudin, sollicitudin orci vitae, vehicula odio. Nullam vitae pulvinar mi. Mauris vel lorem vitae turpis egestas dictum. Curabitur laoreet dignissim pulvinar. Sed eget nibh ipsum. Pellentesque at quam gravida, vehicula risus ut, faucibus arcu. Aliquam mollis ligula lorem, vel accumsan metus imperdiet vitae. Fusce metus sem, porttitor quis libero sed, accumsan elementum nibh. Donec non nisi metus. Duis ut malesuada arcu. Ut eget efficitur tortor, non dignissim ipsum. Aenean feugiat, lorem quis imperdiet mattis, urna est hendrerit lacus, vitae aliquam libero enim vitae tellus. Integer finibus vitae nibh vel faucibus.</p>' +
                '</blockquote>' +
                '<blockquote>' +
                '<p>Maecenas placerat sem aliquam augue lacinia imperdiet. Sed sit amet nisl tortor. Nam nisi purus, dictum sit amet ex facilisis, iaculis efficitur orci. Aliquam quis leo a dui bibendum ullamcorper. Sed eu sagittis velit. Donec non eleifend felis, sed porttitor tellus. Etiam vitae mi eget tellus dictum molestie. Mauris ornare est ac sapien faucibus maximus. Vestibulum fermentum tortor sapien, tincidunt scelerisque ipsum luctus quis. Curabitur ultricies vel sem non sagittis. Etiam tincidunt auctor ullamcorper. Morbi quis finibus purus, sed aliquet ipsum. Phasellus feugiat magna euismod magna condimentum, vitae elementum neque ullamcorper.</p>' +
                '</blockquote>' +
                '<blockquote>' +
                '<p>Ut vitae est sollicitudin, sollicitudin orci vitae, vehicula odio. Nullam vitae pulvinar mi. Mauris vel lorem vitae turpis egestas dictum. Curabitur laoreet dignissim pulvinar. Sed eget nibh ipsum. Pellentesque at quam gravida, vehicula risus ut, faucibus arcu. Aliquam mollis ligula lorem, vel accumsan metus imperdiet vitae. Fusce metus sem, porttitor quis libero sed, accumsan elementum nibh. Donec non nisi metus. Duis ut malesuada arcu. Ut eget efficitur tortor, non dignissim ipsum. Aenean feugiat, lorem quis imperdiet mattis, urna est hendrerit lacus, vitae aliquam libero enim vitae tellus. Integer finibus vitae nibh vel faucibus.</p>' +
                '</blockquote>' +
                '<p>In lacus sem, varius ut lorem quis, feugiat viverra sem. Integer rutrum elit eget justo tempus, quis efficitur odio luctus. Fusce risus eros, ullamcorper et rutrum quis, tristique at metus. Aliquam lacinia orci viverra eros aliquam, at rhoncus dolor blandit. Aliquam nisi sem, cursus quis augue vitae, mattis cursus lectus. Quisque a hendrerit nunc. Maecenas varius vulputate vestibulum.</p>' +
                '<blockquote>' +
                '<p>Donec vitae vestibulum orci. Ut et eleifend velit. Suspendisse gravida massa vel nibh finibus, in pulvinar eros vulputate. Quisque ornare facilisis pulvinar. Donec in libero nec odio porta suscipit. Suspendisse convallis sapien diam, sit amet placerat ipsum maximus in. Aliquam luctus bibendum lorem, sed porttitor elit elementum in. Nunc faucibus mollis erat, a ullamcorper odio commodo quis. Fusce ultrices urna quis ante accumsan venenatis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Etiam tristique facilisis tempor. Mauris fermentum elementum semper. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Etiam viverra mauris sit amet dolor consectetur, molestie mattis sapien blandit.</p>' +
                '</blockquote>' +
                '<blockquote>' +
                '<p>Ut vitae est sollicitudin, sollicitudin orci vitae, vehicula odio. Nullam vitae pulvinar mi. Mauris vel lorem vitae turpis egestas dictum. Curabitur laoreet dignissim pulvinar. Sed eget nibh ipsum. Pellentesque at quam gravida, vehicula risus ut, faucibus arcu. Aliquam mollis ligula lorem, vel accumsan metus imperdiet vitae. Fusce metus sem, porttitor quis libero sed, accumsan elementum nibh. Donec non nisi metus. Duis ut malesuada arcu. Ut eget efficitur tortor, non dignissim ipsum. Aenean feugiat, lorem quis imperdiet mattis, urna est hendrerit lacus, vitae aliquam libero enim vitae tellus. Integer finibus vitae nibh vel faucibus.</p>' +
                '</blockquote>' +
                '<p>Vivamus viverra dui lorem, sit amet tincidunt neque lobortis quis. Donec at nunc at felis tristique porttitor cursus vel dolor. Quisque fermentum et tortor quis placerat. Nullam et dolor nec mauris viverra eleifend. Vestibulum semper eleifend odio, eu aliquam ante egestas eu. Fusce non metus scelerisque, congue quam a, viverra velit. Fusce feugiat eget lacus non lacinia. Nunc eu rhoncus neque. Cras non urna sapien. Mauris sodales dignissim nisl, eu mollis elit luctus eget. Sed non imperdiet augue.</p>' +
                '<p>Quisque posuere, libero nec sagittis ultricies, magna ipsum congue lectus, sit amet accumsan nulla nisl non orci. Curabitur neque ex, ultrices sit amet tempor id, iaculis a odio. Mauris rutrum non neque id viverra. Praesent tempor dolor auctor, blandit mi eu, aliquam ex. Suspendisse sodales nisi elit, non lobortis odio suscipit non. In luctus nec erat nec faucibus. Cras pharetra orci ac ligula consequat rhoncus. Morbi fermentum mauris et sagittis commodo. Sed quis euismod massa, nec hendrerit mi. Donec a odio lorem. Suspendisse libero nisl, tristique vitae blandit sit amet, auctor eu turpis. Morbi at mauris gravida mauris consectetur feugiat. Duis egestas odio quis augue rhoncus consequat.</p>',
            isDraft: false,
            deleted: false
        }
    };
    static timelines = {
        TL01: {
            tid: 'TL01',
            title: 'Pellentesque habitant',
            entries: [],
            deleted: false
        },
        TL02: {
            tid: 'TL02',
            title: 'Lorem Ipsum',
            entries: [
                {
                    entryId: 'CL001',
                    importance: 'major',
                    date: {
                        y: '2034 a.T.',
                        m: 'Mês',
                        d: 'Dia'
                    },
                    title: 'Queda do Meteoro Boisupiranga',
                    type: 'COS',
                    flavor: 'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...',
                    text: [
                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus porta tincidunt malesuada. Quisque ullamcorper eget ligula non porttitor. Donec eu cursus nisi. Morbi dapibus dolor a nulla aliquam, in ullamcorper mi ornare. Praesent nec ligula eget massa laoreet fringilla vel vel lacus. In hac habitasse platea dictumst. Donec sodales quis libero ut convallis. In hac habitasse platea dictumst. Fusce quis nisl lacus.',
                        'Donec ex turpis, fermentum eget ligula id, auctor consectetur libero. In ac lorem id tortor ullamcorper feugiat. Cras ac elit sed augue imperdiet egestas quis at odio. Integer non quam quis tellus sodales auctor et et mauris. Phasellus maximus ligula sed augue viverra, vitae aliquam augue tincidunt. Praesent in lobortis quam. Ut in dui odio. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;',
                        'Nam pharetra felis purus, lobortis ultricies augue aliquet consequat. Vestibulum dapibus convallis elit, quis efficitur justo tempus vel. Donec dolor purus, finibus et elit facilisis, sagittis vehicula lacus.'
                    ]
                },
                {
                    entryId: 'FN002',
                    importance: 'minor',
                    date: {
                        y: '1975 a.T.',
                        m: 'Mês',
                        d: 'Dia'
                    },
                    title: 'Descoberta do Trigo Espada',
                    type: 'FLO',
                    flavor: 'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...',
                    text: [
                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus porta tincidunt malesuada. Quisque ullamcorper eget ligula non porttitor. Donec eu cursus nisi. Morbi dapibus dolor a nulla aliquam, in ullamcorper mi ornare. Praesent nec ligula eget massa laoreet fringilla vel vel lacus. In hac habitasse platea dictumst. Donec sodales quis libero ut convallis. In hac habitasse platea dictumst. Fusce quis nisl lacus.',
                        'Donec ex turpis, fermentum eget ligula id, auctor consectetur libero. In ac lorem id tortor ullamcorper feugiat. Cras ac elit sed augue imperdiet egestas quis at odio. Integer non quam quis tellus sodales auctor et et mauris. Phasellus maximus ligula sed augue viverra, vitae aliquam augue tincidunt. Praesent in lobortis quam. Ut in dui odio.'
                    ]
                },
                {
                    entryId: 'TL01',
                    importance: 'external',
                    date: {
                        y: '537 d.T.',
                        m: 'Mês',
                        d: 'Dia'
                    },
                    title: 'Guerra dos 300 Anos',
                    type: null,
                    flavor: null,
                    text: [
                        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
                    ]
                }
            ],
            deleted: false
        }
    };
}