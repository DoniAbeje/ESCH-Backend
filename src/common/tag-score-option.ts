export class TagScoreOption {
  primaryScoreInc: number;
  secondaryScoreInc: number;

  static readonly DEFAULT_PRIMARY_SCORE_INC = 0.25;
  static readonly DEFAULT_SECONDARY_SCORE_INC = 0.1;

  static readonly DEFAULT: TagScoreOption = {
    primaryScoreInc: TagScoreOption.DEFAULT_PRIMARY_SCORE_INC,
    secondaryScoreInc: TagScoreOption.DEFAULT_SECONDARY_SCORE_INC,
  };
}
