export function getRatingColorClasses(rating) {
  const value = Number(rating || 0);
  if (value >= 4) {
    return {
      solid: 'fill-violet-500 text-violet-500',
      half: 'fill-violet-500/50 text-violet-500',
    };
  }

  if (value >= 3) {
    return {
      solid: 'fill-emerald-500 text-emerald-500',
      half: 'fill-emerald-500/50 text-emerald-500',
    };
  }

  return {
    solid: 'fill-orange-500 text-orange-500',
    half: 'fill-orange-500/50 text-orange-500',
  };
}

