import com.brainbites.timer.BrainBitesTimerPackage;

@Override
protected List<ReactPackage> getPackages() {
  List<ReactPackage> packages = new PackageList(this).getPackages();
  packages.add(new BrainBitesTimerPackage());
  return packages;
} 