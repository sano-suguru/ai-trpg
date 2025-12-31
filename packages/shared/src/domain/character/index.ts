/**
 * キャラクタードメインモデルのバレルエクスポート
 */

// Fragments
export {
  FragmentCategories,
  type FragmentCategory,
  type FragmentText,
  createFragmentText,
  type OriginFragment,
  type LossFragment,
  type MarkFragment,
  type SinFragment,
  type QuestFragment,
  type TraitFragment,
  type Fragment,
  type CharacterFragments,
  createOriginFragment,
  createLossFragment,
  createMarkFragment,
  createSinFragment,
  createQuestFragment,
  createTraitFragment,
  type CreateFragmentsInput,
  createCharacterFragments,
  fragmentsToPlain,
  getFragmentCategoryLabel,
} from "./fragments";

// Directives
export {
  DirectiveSituations,
  type DirectiveSituation,
  type DirectiveResponse,
  createDirectiveResponse,
  type DangerDirective,
  type AllyInPerilDirective,
  type MoralChoiceDirective,
  type UnknownDirective,
  type Directive,
  type CharacterDirectives,
  createDangerDirective,
  createAllyInPerilDirective,
  createMoralChoiceDirective,
  createUnknownDirective,
  type CreateDirectivesInput,
  createCharacterDirectives,
  directivesToPlain,
  getDirectiveSituationLabel,
  DangerOptions,
  AllyInPerilOptions,
  MoralChoiceOptions,
  UnknownOptions,
} from "./directives";

// Types
export {
  type CharacterName,
  createCharacterName,
  type CharacterTitle,
  createCharacterTitle,
  type Biography,
  createBiography,
  LendingSettings,
  type LendingSetting,
  isLendingSetting,
  createLendingSetting,
  type VoiceSample,
  type HistoryEntry,
  type Relationship,
  type DraftCharacter,
  type Character,
  type BorrowableCharacter,
  isDraftCharacter,
  isCharacter,
  isBorrowable,
  type CharacterSummary,
  toCharacterSummary,
} from "./types";

// Operations
export {
  type UpdateCharacterInput,
  updateCharacter,
  addHistoryEntry,
  updateCurrentWounds,
  addWound,
  healWound,
  upsertRelationship,
  removeRelationship,
  toBorrowableView,
  canParticipateInSession,
  canDieInSession,
  canHavePermanentChanges,
  type CreateCharacterInput,
  createCharacter,
} from "./operations";
