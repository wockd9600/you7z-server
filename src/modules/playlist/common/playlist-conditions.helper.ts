enum PlaylistType {
  POPULAR,
  // MY,
  CREATED,
  // MY_WITH_CREATED,
}

export function buildPlaylistWhereCondition(
  userId: number,
  type: PlaylistType,
  search_term?: string,
) {
  const whereCondition: any = { status: 1 };

  if (search_term) {
    whereCondition.OR = [
      { title: { contains: search_term, mode: 'insensitive' } },
    ];
  }

  if (type === PlaylistType.CREATED) {
    delete whereCondition.status;
    whereCondition.userId = userId;
  }

  return whereCondition;
}
