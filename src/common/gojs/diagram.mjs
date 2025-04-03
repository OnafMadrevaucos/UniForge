import * as config from "./config.mjs";

const theme = config.theme;

const nameProperty = config.nameProperty;
const genderProperty = config.genderProperty;
const statusProperty = config.statusProperty;
const countProperty = config.countProperty;

// toggle highlight on mouse enter/leave
// this sample also uses highlight for selection, so only unhighlight if unselected
const onMouseEnterPart = (e, part) => part.isHighlighted = true;
const onMouseLeavePart = (e, part) => { if (!part.isSelected) part.isHighlighted = false; }
const onSelectionChange = (part) => { part.isHighlighted = part.isSelected; }

const getStrokeForStatus = (status) => {
    switch (status) {
        case 'king':
        case 'queen':
            return theme.colors.kingQueenBorder;
        case 'prince':
        case 'princess':
            return theme.colors.princePrincessBorder;
        case 'civilian':
        default:
            return theme.colors.civilianBorder;
    }
};

function getAlignment(tier) {
    return new go.Spot(0.5, 0.5, (tier & 1) === 0 ? -12.5 : 12.5, (tier & 2) === 0 ? -12.5 : 12.5);
}

function strokeStyle(shape) {
    return shape
        .set({
            fill: theme.colors.personNodeBackground,
            strokeWidth: config.STROKE_WIDTH
        })
        .bind('stroke', statusProperty, status => getStrokeForStatus(status))
        .bindObject('stroke', 'isHighlighted', (isHighlighted, obj) =>
            isHighlighted
                ? theme.colors.selectionStroke
                : getStrokeForStatus(obj.part.data.status))
}

function pictureStyle(pic) {
    return pic
        .bind('source', '', ({ status, gender }) => {
            switch (status) {
                case 'king':
                case 'queen':
                    return './images/king.svg';
                case 'prince':
                case 'princess':
                    return './images/prince.svg';
                case 'civilian':
                    return gender === 'M'
                        ? './images/male-civilian.svg'
                        : './images/female-civilian.svg';
                default:
                    return './images/male-civilian.svg';
            }
        })
        // The SVG files are different sizes, so this keeps their aspect ratio reasonable
        .bind('desiredSize', 'status', status => {
            switch (status) {
                case 'king':
                case 'queen':
                    return new go.Size(30, 20)
                case 'prince':
                case 'princess':
                    return new go.Size(28, 20)
                case 'civilian':
                default:
                    return new go.Size(24, 24)
            }
        });
}

const genderToText = (gender) => (gender === 'm' ? 'HOMEM' : 'MULHER');

const genderToTextColor = (gender) =>
    gender === 'm' ? theme.colors.maleBadgeText : theme.colors.femaleBadgeText;

const genderToFillColor = (gender) =>
    gender === 'm'
        ? theme.colors.maleBadgeBackground
        : theme.colors.femaleBadgeBackground;

const personBadge = () =>
    new go.Panel('Auto', {
        alignmentFocus: go.Spot.TopRight,
        alignment: new go.Spot(1, 0, -25, config.STROKE_WIDTH - 0.5)
    })
        .add(
            new go.Shape({
                figure: 'RoundedRectangle',
                parameter1: config.CORNER_ROUNDNESS,
                parameter2: 4 | 8, // round only the bottom
                desiredSize: new go.Size(NaN, 22.5),
                stroke: null
            })
                .bind('fill', genderProperty, genderToFillColor),
            new go.TextBlock({
                font: theme.fonts.badgeFont
            })
                .bind('stroke', genderProperty, genderToTextColor)
                .bind('text', genderProperty, genderToText)
        )

const personBirthDeathTextBlock = () =>
    new go.TextBlock({
        stroke: theme.colors.personText,
        font: theme.fonts.birthDeathFont,
        alignmentFocus: go.Spot.Top,
        alignment: new go.Spot(0.5, 1, 0, -35)
    })
        .bind('text', '', ({ born, death }) => {
            if (!born) return '';
            return `${born} - ${death ?? ''}`;
        })

// Panel to display the number of children a node has
const personCounter = () =>
    new go.Panel('Auto', {
        visible: false,
        alignmentFocus: go.Spot.Center,
        alignment: go.Spot.Bottom
    })
        .bindObject('visible', '', (obj) => obj.findLinksOutOf('genitor').count > 0)
        .add(
            new go.Shape('Circle', {
                desiredSize: new go.Size(29, 29),
                strokeWidth: config.STROKE_WIDTH,
                stroke: theme.colors.counterBorder,
                fill: theme.colors.counterBackground
            }),
            new go.TextBlock({
                alignment: new go.Spot(0.5, 0.5, 0, 1),
                stroke: theme.colors.counterText,
                font: theme.fonts.counterFont,
                textAlign: 'center'
            })
                .bindObject('text', '', (obj) => obj.findNodesOutOf('genitor').count)
        )

const personImage = () =>
    new go.Panel('Spot', {
        alignmentFocus: go.Spot.Top,
        alignment: new go.Spot(0, 0, config.STROKE_WIDTH / 2, config.IMAGE_TOP_MARGIN)
    })
        .add(
            new go.Shape({
                figure: 'Circle',
                desiredSize: new go.Size(config.IMAGE_DIAMETER, config.IMAGE_DIAMETER)
            })
                .apply(strokeStyle),
            new go.Picture({ scale: 0.9 })
                .apply(pictureStyle)
        );

const personMainShape = () =>
    new go.Shape({
        figure: 'RoundedRectangle',
        desiredSize: new go.Size(215, 110),
        portId: '',
        parameter1: config.CORNER_ROUNDNESS
    })
        .apply(strokeStyle);

const personNameTextBlock = () =>
    new go.TextBlock({
        stroke: theme.colors.personText,
        font: theme.fonts.nameFont,
        desiredSize: new go.Size(160, 50),
        overflow: go.TextOverflow.Ellipsis,
        textAlign: 'center',
        verticalAlignment: go.Spot.Center,
        toolTip: go.GraphObject.build('ToolTip')
            .add(new go.TextBlock({ margin: 4 }).bind('text', nameProperty)),
        alignmentFocus: go.Spot.Top,
        alignment: new go.Spot(0.5, 0, 0, 25)
    })
        .bind('text', nameProperty)


const createNodeTemplate = () =>
    new go.Node('Spot', {
        selectionAdorned: false,
        //movable: false,
        mouseEnter: onMouseEnterPart,
        mouseLeave: onMouseLeavePart,
        selectionChanged: onSelectionChange
    })
        .bindObject("alignment", "tier", getAlignment)
        .add(
            new go.Panel('Spot')
                .add(
                    personMainShape(),
                    personNameTextBlock(),
                    personBirthDeathTextBlock()
                ),
            personImage(),
            personBadge(),
            personCounter()
        )

const createLinkTemplate = () =>
    new go.Link({
        selectionAdorned: false,
        routing: go.Routing.Orthogonal,
        layerName: 'Background',
        mouseEnter: onMouseEnterPart,
        mouseLeave: onMouseLeavePart
    })
        .add(
            new go.Shape({
                stroke: theme.colors.link,
                strokeWidth: 1
            })
                .bind("strokeDashArray", "type", t => {
                    return (t === 'ended' ? [5, 5] : null);
                })
                .bindObject('stroke', 'isHighlighted', (isHighlighted) =>
                    isHighlighted ? theme.colors.selectionStroke : theme.colors.link
                )
                .bindObject('stroke', 'isSelected', (selected) =>
                    selected ? theme.colors.selectionStroke : theme.colors.link
                )
                .bindObject('strokeWidth', 'isSelected', (selected) => selected ? 2 : 1)

        );


export function buildDiagram(container, config, nodes, links) {
    const diagram = new go.Diagram(container, config);

    diagram.nodeTemplate = createNodeTemplate();
    diagram.linkTemplate = createLinkTemplate();

    diagram.model = new go.GraphLinksModel(nodes, links);

    return diagram;
};