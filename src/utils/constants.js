import {
    Ghost,
    Cat,
    Dog,
    Apple,
    Rocket,
    Gamepad2,
    BookOpen,
    Star,
    BrainCircuit,
    PenTool,
    Award,
    Timer,
    Zap,
    Target,
    Map,
    Puzzle,
    Lightbulb,
    BarChart3,
    ClipboardList
} from 'lucide-react';

export const avatars = [
    { id: 'ghost', icon: Ghost, color: 'bg-purple-100 text-purple-600' },
    { id: 'cat', icon: Cat, color: 'bg-orange-100 text-orange-600' },
    { id: 'dog', icon: Dog, color: 'bg-blue-100 text-blue-600' },
    { id: 'apple', icon: Apple, color: 'bg-red-100 text-red-600' },
    { id: 'rocket', icon: Rocket, color: 'bg-indigo-100 text-indigo-600' },
    { id: 'gamepad', icon: Gamepad2, color: 'bg-green-100 text-green-600' },
];

export const topicsMap = {
    'Class 6': [
        { id: 'knowingNumbers', label: 'knowingNumbers', icon: BookOpen, progress: 0 },
        { id: 'wholeNumbers', label: 'wholeNumbers', icon: Star, progress: 0 },
        { id: 'playingNumbers', label: 'playingNumbers', icon: BrainCircuit, progress: 0 },
        { id: 'integers', label: 'integers', icon: PenTool, progress: 0 },
        { id: 'fractions', label: 'fractions', icon: Award, progress: 0 },
        { id: 'decimals', label: 'decimals', icon: Timer, progress: 0 },
        { id: 'algebra', label: 'algebra', icon: Zap, progress: 0 },
        { id: 'ratioProportions', label: 'ratioProportions', icon: Target, progress: 0 },
        { id: 'basicGeometry', label: 'basicGeometry', icon: Map, progress: 0 },
        { id: 'elementaryShapes', label: 'elementaryShapes', icon: Puzzle, progress: 0 },
        { id: 'symmetry', label: 'symmetry', icon: Lightbulb, progress: 0 },
        { id: 'mensuration', label: 'mensuration', icon: BarChart3, progress: 0 },
        { id: 'dataHandling', label: 'dataHandling', icon: ClipboardList, progress: 0 },
    ],
    'Class 7': [
        { id: 'integersC7', label: 'integersC7', icon: BookOpen, progress: 0 },
        { id: 'fractionsDecimalsC7', label: 'fractionsDecimalsC7', icon: Star, progress: 0 },
        { id: 'dataHandlingC7', label: 'dataHandlingC7', icon: BarChart3, progress: 0 },
        { id: 'simpleEquations', label: 'simpleEquations', icon: PenTool, progress: 0 },
        { id: 'linesAngles', label: 'linesAngles', icon: Map, progress: 0 },
        { id: 'trianglesProperties', label: 'trianglesProperties', icon: BrainCircuit, progress: 0 },
        { id: 'congruence', label: 'congruence', icon: Award, progress: 0 },
        { id: 'comparingQuantities', label: 'comparingQuantities', icon: Target, progress: 0 },
        { id: 'rationalNumbers', label: 'rationalNumbers', icon: Zap, progress: 0 },
        { id: 'algebraicExpressions', label: 'algebraicExpressions', icon: Lightbulb, progress: 0 },
        { id: 'exponentsPowers', label: 'exponentsPowers', icon: Timer, progress: 0 },
        { id: 'perimeterArea', label: 'perimeterArea', icon: ClipboardList, progress: 0 },
        { id: 'practicalGeometry', label: 'practicalGeometry', icon: Puzzle, progress: 0 },
        { id: 'symmetryC7', label: 'symmetryC7', icon: Lightbulb, progress: 0 },
        { id: 'visualisingSolidShapesC7', label: 'visualisingSolidShapesC7', icon: Map, progress: 0 },
    ],
    'Class 8': [
        { id: 'rationalNumbersC8', label: 'rationalNumbersC8', icon: BookOpen, progress: 0 },
        { id: 'linearEquations', label: 'linearEquations', icon: PenTool, progress: 0 },
        { id: 'quadrilaterals', label: 'quadrilaterals', icon: Map, progress: 0 },
        { id: 'dataHandlingC8', label: 'dataHandlingC8', icon: BarChart3, progress: 0 },
        { id: 'squareRoots', label: 'squareRoots', icon: BrainCircuit, progress: 0 },
        { id: 'cubeRoots', label: 'cubeRoots', icon: Star, progress: 0 },
        { id: 'comparingQuantitiesC8', label: 'comparingQuantitiesC8', icon: Target, progress: 0 },
        { id: 'algebraicIdentities', label: 'algebraicIdentities', icon: Zap, progress: 0 },
        { id: 'mensurationC8', label: 'mensurationC8', icon: Award, progress: 0 },
        { id: 'exponentsPowersC8', label: 'exponentsPowersC8', icon: Timer, progress: 0 },
        { id: 'directInverseProp', label: 'directInverseProp', icon: Lightbulb, progress: 0 },
        { id: 'factorisation', label: 'factorisation', icon: Puzzle, progress: 0 },
        { id: 'introGraphs', label: 'introGraphs', icon: ClipboardList, progress: 0 },
        { id: 'visualisingSolidShapesC8', label: 'visualisingSolidShapesC8', icon: Map, progress: 0 },
        { id: 'playingNumbersC8', label: 'playingNumbersC8', icon: BrainCircuit, progress: 0 },
    ],
};

export const timeCommitments = [
    { id: '15m', label: '15 mins', val: '15-minute' },
    { id: '30m', label: '30 mins', val: '30-minute' },
    { id: '60m', label: '1 hour', val: '60-minute' },
];

export const classes = ['Class 6', 'Class 7', 'Class 8'];
export const exams = ['CBSE Mathematics'];
